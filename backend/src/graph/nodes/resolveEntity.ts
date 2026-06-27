import { z } from "zod";
import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { webSearchTool } from '../../tools/webSearchTool';

const EntitySchema = z.object({
  legalName: z.string().describe("The official legal name of the company"),
  domain: z.string().optional().describe("The primary website domain of the company, if known"),
  ticker: z.string().optional().describe("The stock ticker symbol if it is a public company, otherwise leave undefined"),
  industry: z.string().optional().describe("The primary industry the company operates in"),
  isPublic: z.boolean().describe("Whether the company is publicly traded on a stock exchange")
});

export const resolveEntity = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running resolveEntity for:', state.companyName);
  
  // Phase 9 preview: Check if report was generated in the last 7 days.
  // We'll leave the actual DB check for Phase 9, but here we can mock the fallback.

  let errors: string[] = [];
  try {
    const searchResults = await webSearchTool(`${state.companyName} company official legal name stock ticker exchange`);
    const searchContext = searchResults.map(r => `${r.title}\n${r.content}`).join('\n\n');

    const llm = getLLM();
    if (!llm) {
      return { 
        resolvedEntity: { legalName: state.companyName, isPublic: false } 
      };
    }

    const modelWithStructure = llm.withStructuredOutput(EntitySchema, { name: "resolve_entity" });
    const prompt = `Based on the following search results for the company named "${state.companyName}", disambiguate the company and provide its legal name, domain, stock ticker (if public), industry, and whether it is public.\n\nSearch Results:\n${searchContext}`;
    
    const result = await modelWithStructure.invoke(prompt);
    
    return { resolvedEntity: result };
  } catch (error: any) {
    console.error("Error in resolveEntity:", error);
    errors.push(`resolveEntity failed: ${error.message}`);
    return { 
      errors,
      resolvedEntity: { legalName: state.companyName, isPublic: false } 
    };
  }
};
