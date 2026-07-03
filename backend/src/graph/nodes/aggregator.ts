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
    competitiveLandscape: state.competitiveLandscape,
    secFilings: state.secFilings,
    macroContext: state.macroContext
  };

  const llm = getLLM();
  if (!llm) {
    return { researchBrief: "Mock aggregated research brief containing all details." };
  }

  const prompt = `You are a financial analyst. Synthesize the following raw data points into a cohesive, deduplicated research brief for ${state.resolvedEntity?.legalName || state.companyName}. Do not hallucinate data that is not provided.

Raw Data:
${JSON.stringify(allData, null, 2)}

IMPORTANT: Output ONLY the research brief text. Do not output JSON, introductory phrases, or markdown blocks. Just the plain text brief.`;

  try {
    const result = await llm.invoke(prompt);
    const textContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    return { researchBrief: textContent };
  } catch (error: any) {
    console.error("Error in aggregator:", error);
    return { errors: [`aggregator failed: ${error.message}`] };
  }
};
