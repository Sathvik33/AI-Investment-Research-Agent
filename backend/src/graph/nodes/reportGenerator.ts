import { ResearchState } from '../state';
import { prisma } from '../../db/prisma';
import { RunnableConfig } from "@langchain/core/runnables";

/**
 * Maps finding sourceType values to substrings of their corresponding citation source names.
 * Used to correctly associate citations with their source finding type when persisting to DB.
 */
const CITATION_SOURCE_MAP: Record<string, string[]> = {
  "web":         ["web search"],
  "financials":  ["yahoo finance"],
  "news":        ["yahoo finance news"],
  "competitors": ["competitors"]
};

export const reportGenerator = async (state: ResearchState, config?: RunnableConfig): Promise<Partial<ResearchState>> => {
  console.log('Running reportGenerator...');

  const runId = config?.configurable?.thread_id;

  if (!runId) {
    console.warn("No thread_id (runId) provided in config. Skipping DB persistence.");
    return {};
  }

  try {
    // 1. Update run status
    await prisma.researchRun.update({
      where: { id: runId },
      data: {
        status: "completed",
        completedAt: new Date()
      }
    });

    // 2. Persist Report
    if (state.decision && state.scores) {
      await prisma.report.create({
        data: {
          runId,
          verdict: state.decision.verdict,
          confidence: state.decision.confidence,
          reasoning: state.decision.reasoning,
          scores: state.scores as any,
          keyRisks: state.decision.keyRisks,
          keyOpportunities: state.decision.keyOpportunities,
          tradingStrategy: {
            entryPoint: state.decision.entryPoint,
            exitPoint: state.decision.exitPoint,
            shortTermStrategy: state.decision.shortTermStrategy,
            longTermStrategy: state.decision.longTermStrategy
          }
        } as any
      });
    }

    // 3. Persist Findings — filter citations by matching source name to finding type
    const findingsData = [
      { type: "web",         data: state.webResearch },
      { type: "financials",  data: state.financials },
      { type: "news",        data: state.newsSentiment },
      { type: "competitors", data: state.competitiveLandscape }
    ];

    for (const item of findingsData) {
      if (item.data) {
        const matchTerms = CITATION_SOURCE_MAP[item.type] || [item.type];
        const citationsForType = state.citations.filter(c =>
          matchTerms.some(term => c.source.toLowerCase().includes(term))
        );

        await prisma.researchFinding.create({
          data: {
            runId,
            sourceType: item.type,
            payload: item.data as any,
            citations: citationsForType as any
          }
        });
      }
    }

    console.log(`Successfully generated and persisted report for run ${runId}`);
  } catch (error: any) {
    console.error("Error in reportGenerator:", error);
    return { errors: [`reportGenerator failed: ${error.message}`] };
  }

  return {};
};
