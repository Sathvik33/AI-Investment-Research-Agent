import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { webSearchTool } from '../../tools/webSearchTool';
import { z } from "zod";

const CompetitorSchema = z.object({
  marketPosition: z.string().describe("The company's market position or niche"),
  keyCompetitors: z.array(z.string()).describe("List of key competitors")
});

export const competitorAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running competitorAgent...');
  let errors: string[] = [];
  let citations = state.citations || [];

  try {
    const query = `${state.resolvedEntity?.legalName || state.companyName} competitors market position`;
    const searchResults = await webSearchTool(query, 3);
    
    const combinedText = searchResults.map(r => r.content).join('\n\n');

    citations.push(...searchResults.map(r => ({
      source: "Web Search (Competitors)",
      url: r.url,
      description: r.title
    })));

    const llm = getLLM();
    if (!llm) {
      return { 
        competitiveLandscape: { marketPosition: "Leader", keyCompetitors: ["Mock Comp 1", "Mock Comp 2"] },
        citations
      };
    }

    const modelWithStructure = llm.withStructuredOutput(CompetitorSchema, { name: "competitor_analysis" });
    const prompt = `Based on the following web research for ${state.resolvedEntity?.legalName || state.companyName}, identify its market position and key competitors.\n\nResearch Data:\n${combinedText}`;
    
    const result = await modelWithStructure.invoke(prompt);
    
    return { 
      competitiveLandscape: result,
      citations
    };
  } catch (error: any) {
    console.error("Error in competitorAgent:", error);
    errors.push(`competitorAgent failed: ${error.message}`);
    return { errors };
  }
};
