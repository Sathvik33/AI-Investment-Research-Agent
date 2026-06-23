import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { z } from "zod";

const AggregatorSchema = z.object({
  researchBrief: z.string().describe("A comprehensive, deduplicated, and cohesive research brief synthesizing all findings.")
});

export const aggregator = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running aggregator...');
  
  const allData = {
    webResearch: state.webResearch,
    financials: state.financials,
    newsSentiment: state.newsSentiment,
    competitiveLandscape: state.competitiveLandscape
  };

  const llm = getLLM();
  if (!llm) {
    return { researchBrief: "Mock aggregated research brief containing all details." };
  }

  const modelWithStructure = llm.withStructuredOutput(AggregatorSchema, { name: "aggregate_research" });
  const prompt = `You are a financial analyst. Synthesize the following raw data points into a cohesive, deduplicated research brief for ${state.resolvedEntity?.legalName || state.companyName}. Do not hallucinate data that is not provided.\n\nRaw Data:\n${JSON.stringify(allData, null, 2)}`;
  
  try {
    const result = await modelWithStructure.invoke(prompt);
    return { researchBrief: result.researchBrief };
  } catch (error: any) {
    console.error("Error in aggregator:", error);
    return { errors: [`aggregator failed: ${error.message}`] };
  }
};
