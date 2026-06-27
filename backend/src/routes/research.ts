import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { getGraph } from '../graph/graph';
import { runEmitter } from '../lib/sse';
import { randomUUID as uuidv4 } from 'crypto';
import { runFollowupChain } from '../chains/followupChain';
import { rateLimiter } from '../middleware/rateLimiter';
import YF from 'yahoo-finance2';

const customLogger = {
  ...console,
  warn: (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Unsupported environment')) return;
    console.warn(...args);
  }
};
const yahooFinance = new (YF as any)({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
  logger: customLogger 
});

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
       res.json([]);
       return;
    }
    
    const results = await yahooFinance.search(query) as any;
    const options = results.quotes
      .filter((q: any) => q.isYahooFinance)
      .map((q: any) => ({
         symbol: q.symbol,
         shortname: q.shortname,
         exchange: q.exchange
      }))
      .slice(0, 10);
    res.json(options);
  } catch (error: any) {
    console.error('Search error:', error.message || error);
    
    const errString = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || 500;
    
    if (status === 429 || errString.includes('rate limit') || errString.includes('too many requests')) {
      res.status(429).json({ error: 'Rate limited. Please try again after 10 minutes.' });
    } else if (errString.includes('network') || errString.includes('econnreset') || errString.includes('enotfound') || errString.includes('timeout')) {
      res.status(503).json({ error: 'Network issue. Please change your network or check your connection.' });
    } else if (status >= 500 || errString.includes('server') || errString.includes('bad gateway') || errString.includes('unavailable')) {
      res.status(502).json({ error: 'Server downtime at data provider. Please try again after some time.' });
    } else {
      res.status(500).json({ error: 'API is currently not working. Please try again later.' });
    }
  }
});

router.post('/', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { companyName, ticker } = req.body;
    if (!companyName) {
       res.status(400).json({ error: 'companyName is required' });
       return;
    }

    // Attempt to connect DB for persistence; fallback to ephemeral run if DB is offline
    let runId: string = uuidv4();
    try {
      let company = await prisma.company.findFirst({ where: { name: companyName } });
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName, ticker: ticker || null, isPublic: !!ticker }
        });
      } else if (ticker && !company.ticker) {
        company = await prisma.company.update({
          where: { id: company.id },
          data: { ticker, isPublic: true }
        });
      }

      const sessionId = req.headers['x-session-id'] as string | undefined;

      const run = await prisma.researchRun.create({
        data: { id: runId, companyId: company.id, sessionId: sessionId || null, status: "running" }
      });
      runId = run.id;
    } catch (e) {
      console.warn("DB not ready, proceeding with ephemeral run:", e);
    }

    // Kick off graph asynchronously — respond immediately with runId
    (async () => {
       try {
           // getGraph() lazily compiles with checkpointer on first call
           const graph = await getGraph();
           const config = { configurable: { thread_id: runId } };
           
           // Pass ticker if available so resolveEntity doesn't guess it
           const initialState: any = { companyName };
           if (ticker) {
              initialState.resolvedEntity = {
                legalName: companyName,
                ticker: ticker,
                isPublic: true
              };
           }

           const stream = await graph.stream(initialState, { ...config, streamMode: "updates" });
           
           for await (const chunk of stream) {
             const nodeName = Object.keys(chunk)[0];
             const partialState = (chunk as any)[nodeName];
             
             // Only intercept LLM provider rate limits — abort the whole pipeline early
             // Other errors (DB, tool, parsing) are non-fatal; reflectionAgent handles retries
             if (partialState.errors && partialState.errors.length > 0) {
                 const allErrors = partialState.errors.map((e: string) => e.toLowerCase());
                 const hasRateLimit = allErrors.some((e: string) => 
                   (e.includes('rate limit') || e.includes('429') || e.includes('too many requests')) &&
                   !e.includes('prisma') && !e.includes('database')
                 );
                 if (hasRateLimit) throw new Error("Rate limit exceeded in AI Provider");
             }
             
             runEmitter.emit(`run-${runId}`, { node: nodeName, status: "completed", partialState });
             
             try {
               await prisma.researchRun.update({
                 where: { id: runId },
                 data: { currentNode: nodeName }
               });
             } catch(e){} // Ignore DB errors during ephemeral runs
           }

           runEmitter.emit(`run-${runId}`, { node: "END", status: "completed" });
           runEmitter.emit(`run-${runId}-end`);
       } catch (e: any) {
           console.error(`[Run ${runId}] Graph error:`, e.message || e);
           
           const errStr = (e.message || '').toLowerCase();
           let userFriendlyError = 'An unexpected error occurred during research.';
           
           if (errStr.includes('rate limit') || errStr.includes('429') || errStr.includes('too many requests')) {
             userFriendlyError = 'AI Provider Rate Limit Exceeded. Please try again in a few minutes.';
           } else if (errStr.includes('network') || errStr.includes('timeout')) {
             userFriendlyError = 'Network timeout while analyzing data. Please try again.';
           } else {
             userFriendlyError = `Pipeline Error: ${e.message}`;
           }

           runEmitter.emit(`run-${runId}`, { node: "ERROR", status: "failed", error: userFriendlyError });
           runEmitter.emit(`run-${runId}-end`);
           try {
             await prisma.researchRun.update({ where: { id: runId }, data: { status: "failed" } });
           } catch(err){}
       }
    })();

    res.json({ runId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:runId/stream', (req: Request, res: Response) => {
  const runId = req.params.runId as string;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Heartbeat every 30s to prevent proxy / load-balancer timeout on long pipelines
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  const onUpdate = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onEnd = () => {
    clearInterval(heartbeatInterval);
    res.end();
    runEmitter.off(`run-${runId}`, onUpdate);
    runEmitter.off(`run-${runId}-end`, onEnd);
  };

  runEmitter.on(`run-${runId}`, onUpdate);
  runEmitter.on(`run-${runId}-end`, onEnd);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    runEmitter.off(`run-${runId}`, onUpdate);
    runEmitter.off(`run-${runId}-end`, onEnd);
  });
});

router.get('/:runId', async (req: Request, res: Response) => {
  try {
    const run = await prisma.researchRun.findUnique({
      where: { id: req.params.runId as string },
      // Include company so client can get ticker for PDF filename, charts, etc.
      include: { reports: true, findings: true, company: true }
    }) as any;

    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    
    res.json({
      status: run.status,
      currentNode: run.currentNode,
      report: run.reports.length > 0 ? run.reports[0] : null,
      findings: run.findings,
      company: run.company ? { name: run.company.name, ticker: run.company.ticker } : null
    });
  } catch(e) {
    console.error("Failed to fetch run from DB:", e);
    // Return a proper error instead of fake report data that could mislead users
    res.status(503).json({ error: "Database temporarily unavailable. Please try again." });
  }
});

router.post('/:runId/followup', async (req: Request, res: Response) => {
  try {
    const runId = req.params.runId as string;
    const { question } = req.body;
    if (!question) {
       res.status(400).json({ error: 'question is required' });
       return;
    }
    
    const answer = await runFollowupChain(runId, question);
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:runId/chart', async (req: Request, res: Response) => {
  try {
    const run = await prisma.researchRun.findUnique({
      where: { id: req.params.runId as string },
      include: { company: true }
    }) as any;
    
    // Guard against null company or missing ticker
    if (!run || !run.company || !run.company.ticker) {
      res.status(404).json({ error: "Company ticker not found" });
      return;
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const queryOptions = {
      period1: thirtyDaysAgo.toISOString().split('T')[0],
      period2: today.toISOString().split('T')[0],
      interval: '1d' as const
    };
    
    const historicalResult = await yahooFinance.historical(run.company.ticker, queryOptions) as any[];
    
    let chartData: any[] = [];
    if (historicalResult && historicalResult.length > 0) {
      chartData = historicalResult.map((item: any) => ({
        date: item.date.toISOString().split('T')[0],
        price: item.close
      }));
    }

    let quote = null;
    try {
      quote = await yahooFinance.quote(run.company.ticker) as any;
    } catch(err) {
      console.warn("Could not fetch quote:", err);
    }

    res.json({ chart: chartData, quote });
  } catch (e) {
    console.error("Error fetching chart data:", e);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

export default router;
