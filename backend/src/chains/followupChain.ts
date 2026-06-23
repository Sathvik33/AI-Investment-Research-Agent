import { getLLM } from '../graph/llm';
import { PrismaClient } from '@prisma/client';
import YF from 'yahoo-finance2';
const yahooFinance = new (YF as any)({ suppressNotices: ['yahooSurvey'] });

const prisma = new PrismaClient();

export async function runFollowupChain(runId: string, question: string): Promise<string> {
  const llm = getLLM();
  if (!llm) {
    return "Mock follow-up answer: I'm currently running in mock mode without Anthropic API keys.";
  }

  try {
    // Save user message
    await prisma.message.create({
      data: { runId, role: "user", content: question }
    });

    const run = await prisma.researchRun.findUnique({
      where: { id: runId },
      include: { company: true, reports: true, messages: { orderBy: { createdAt: 'asc' } } }
    });

    const report = run?.reports[0];
    const brief = report ? report.reasoning : "No research brief found.";
    
    // Fetch real-time market data to give the LLM context
    let marketContext = "No real-time market data available.";
    if (run?.company?.ticker) {
      try {
        const quote = await yahooFinance.quote(run.company.ticker) as any;
        if (quote) {
          marketContext = `Current Price: ${quote.regularMarketPrice} ${quote.currency}
Day Open: ${quote.regularMarketOpen}
Day High: ${quote.regularMarketDayHigh}
Day Low: ${quote.regularMarketDayLow}
Previous Close: ${quote.regularMarketPreviousClose}`;
        }
      } catch (e) {
        console.warn("Could not fetch quote for followup:", e);
      }
    }

    // Format message history
    const history = (run?.messages || [])
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = `You are an AI Investment Research Agent. You just produced a report with the following reasoning:
${brief}

Real-Time Market Data:
${marketContext}

Here is the conversation history:
${history}

Please answer the following user question using the context above. If they ask for the current price, provide the exact numbers from the Real-Time Market Data section.
${question}`;

    const result = await llm.invoke(prompt);
    const answer = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);

    // Save assistant message
    await prisma.message.create({
      data: { runId, role: "assistant", content: answer }
    });

    return answer;
  } catch (error: any) {
    console.error("Follow-up chain error:", error);
    return "I encountered an error processing your question. Please ensure the database is connected.";
  }
}
