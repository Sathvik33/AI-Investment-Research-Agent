import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { z } from "zod";

const ReflectionSchema = z.object({
  confidence: z.number().min(0).max(1).describe("Confidence level in the completeness of the research from 0 to 1"),
  missingCriticalData: z.array(z.string()).describe("List of any critically missing data categories (e.g., 'financials', 'news'). Leave empty if data is sufficient.")
});

export const reflectionAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running reflectionAgent... iteration:', state.iterationCount);

  const llm = getLLM();
  if (!llm) {
    return {
      iterationCount: state.iterationCount + 1,
      confidence: 0.9,
      missingData: [] // no missing data in mock
    };
  }

  const modelWithStructure = llm.withStructuredOutput(ReflectionSchema, { name: "reflect" });
  const prompt = `Evaluate the completeness of the following research brief and scores for ${state.resolvedEntity?.legalName || state.companyName}.\n\nResearch Brief:\n${state.researchBrief}\n\nScores:\n${JSON.stringify(state.scores)}\n\nMissing Data Reported by Agents:\n${JSON.stringify(state.missingData)}\n\nProvide a confidence score (0 to 1) and identify if any critical data is genuinely missing and should be retried.`;

  try {
    const result = await modelWithStructure.invoke(prompt);

    // We append the reflection's identified missing data to the state
    return {
      iterationCount: 1, // reducer adds this, so passing 1 increments it
      confidence: result.confidence,
      missingData: result.missingCriticalData
    };
  } catch (error: any) {
    console.error("Error in reflectionAgent:", error);
    return {
      iterationCount: 1,
      errors: [`reflectionAgent failed: ${error.message}`]
    };
  }
};
