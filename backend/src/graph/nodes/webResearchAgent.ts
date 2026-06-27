import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { webSearchTool } from '../../tools/webSearchTool';
import { webFetchTool } from '../../tools/webFetchTool';
import { z } from "zod";

const WebResearchSchema = z.object({
  summary: z.string().describe("General business overview and value proposition"),
  recentDevelopments: z.array(z.string()).describe("List of recent key developments, product launches, or major events")
});

export const webResearchAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running webResearchAgent...');
  let errors: string[] = [];
  let missingData: string[] = [];

  try {
    const query = `${state.resolvedEntity?.legalName || state.companyName} company overview recent developments`;
    const searchResults = await webSearchTool(query, 3);

    let combinedText = searchResults.map(r => r.content).join('\n\n');

    // Also try to scrape the first result if it seems promising
    if (searchResults.length > 0 && searchResults[0].url) {
      const pageContent = await webFetchTool(searchResults[0].url);
      if (pageContent.length > 100) {
        combinedText += `\n\nPage Content (${searchResults[0].url}):\n${pageContent.substring(0, 3000)}`;
      }
    }

    const citations = searchResults.map(r => ({
      source: "Web Search",
      url: r.url,
      description: r.title
    }));

    const llm = getLLM();
    if (!llm) {
      return {
        webResearch: { summary: "Mock summary", recentDevelopments: ["Mock dev"] },
        citations
      };
    }

    const modelWithStructure = llm.withStructuredOutput(WebResearchSchema, { name: "web_research" });
    const prompt = `Based on the following web research for ${state.resolvedEntity?.legalName || state.companyName}, extract a concise business summary and a list of recent developments.\n\nResearch Data:\n${combinedText}`;

    const result = await modelWithStructure.invoke(prompt);

    return {
      webResearch: result,
      citations
    };
  } catch (error: any) {
    console.error("Error in webResearchAgent:", error);
    errors.push(`webResearchAgent failed: ${error.message}`);
    missingData.push("webResearch");
    return { errors, missingData };
  }
};
