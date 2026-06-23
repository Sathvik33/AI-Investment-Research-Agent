import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) return res.json([]);

    const companies = await prisma.company.findMany({
      where: {
        runs: {
          some: { sessionId }
        }
      },
      include: {
        runs: {
          where: { sessionId },
          include: { reports: true },
          orderBy: { completedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.json([]);
  }
});

router.get('/:id/reports', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // We fetch the runs for this company that have reports
    const runs = await prisma.researchRun.findMany({
      where: { companyId: id, status: "completed" },
      include: { reports: true },
      orderBy: { completedAt: 'desc' }
    }) as any[];

    const reports = runs.flatMap(r => r.reports);
    res.json(reports);
  } catch (error) {
    console.error(error);
    // Return mock empty array if DB is not ready
    res.json([]);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });
    
    const runs = await prisma.researchRun.findMany({ where: { companyId: id, sessionId } });
    const runIds = runs.map((r: any) => r.id);
    
    if (runIds.length === 0) {
      return res.json({ success: true });
    }
    
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { runId: { in: runIds } } }),
      prisma.reportEmbedding.deleteMany({ where: { runId: { in: runIds } } }),
      prisma.report.deleteMany({ where: { runId: { in: runIds } } }),
      prisma.researchFinding.deleteMany({ where: { runId: { in: runIds } } }),
      prisma.researchRun.deleteMany({ where: { id: { in: runIds } } })
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;
