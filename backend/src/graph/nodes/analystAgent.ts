import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { z } from "zod";

const ScoresSchema = z.object({
  financialHealth: z.number().min(1).max(10),
  growthPotential: z.number().min(1).max(10),
  moat: z.number().min(1).max(10),
  marketSentiment: z.number().min(1).max(10),
  riskLevel: z.number().min(1).max(10)
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
    const result = await modelWithStructure.invoke(prompt);
    return { scores: result };
  } catch (error: any) {
    console.error("Error in analystAgent:", error);
    return { errors: [`analystAgent failed: ${error.message}`] };
  }
};
