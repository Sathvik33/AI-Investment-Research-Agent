import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { z } from "zod";

const ScoresSchema = z.object({
  financialHealth: z.string().describe("Score from 1 to 10 as a string (e.g. '8')"),
  growthPotential: z.string().describe("Score from 1 to 10 as a string (e.g. '7')"),
  moat: z.string().describe("Score from 1 to 10 as a string (e.g. '9')"),
  marketSentiment: z.string().describe("Score from 1 to 10 as a string (e.g. '6')"),
  riskLevel: z.string().describe("Score from 1 to 10 as a string (e.g. '5')")
});

export const analystAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running analystAgent...');
  
  const llm = getLLM();
  if (!llm) {
    return { 
      scores: { financialHealth: 8, growthPotential: 7, moat: 9, marketSentiment: 6, riskLevel: 3 }
    };
  }

  const modelWithStructure = llm.withStructuredOutput(ScoresSchema, { name: "score_company" });
  const prompt = `Based on the following research brief for ${state.resolvedEntity?.legalName || state.companyName}, score the company from 1 to 10 on the following 5 dimensions: financialHealth, growthPotential, moat, marketSentiment, and riskLevel.\n\nResearch Brief:\n${state.researchBrief}`;
  
  try {
    const rawResult = await modelWithStructure.invoke(prompt);
    const result = {
      financialHealth: parseInt(rawResult.financialHealth, 10) || 5,
      growthPotential: parseInt(rawResult.growthPotential, 10) || 5,
      moat: parseInt(rawResult.moat, 10) || 5,
      marketSentiment: parseInt(rawResult.marketSentiment, 10) || 5,
      riskLevel: parseInt(rawResult.riskLevel, 10) || 5
    };
    return { scores: result };
  } catch (error: any) {
    console.error("Error in analystAgent:", error);
    return { errors: [`analystAgent failed: ${error.message}`] };
  }
};
