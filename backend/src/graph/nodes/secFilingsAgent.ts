import { getLLM } from '../llm';
import { ResearchState } from '../state';
import { webSearchTool } from '../../tools/webSearchTool';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export async function secFilingsAgent(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const company = state.resolvedEntity;

  if (!company || !company.isPublic || !company.legalName) {
    return { secFilings: "N/A - Not a public company or could not resolve legal name." };
  }

  try {
    const query = `${company.legalName} ${company.ticker ? company.ticker + ' ' : ''}10-K risk factors business summary recent`;
    const searchResults = await webSearchTool(query, 4, ['sec.gov']);

    if (!searchResults || searchResults.length === 0) {
      return { secFilings: "No direct SEC filings found for this company." };
    }

    const context = searchResults.map(r => `Title: ${r.title}\nSource: ${r.url}\nContent: ${r.content}`).join('\n\n');

    const prompt = `You are an expert financial auditor parsing SEC 10-K and 10-Q filings.
Given the following search results from the SEC EDGAR database for ${company.legalName}, summarize the key "Risk Factors" and "Business Summary".

Search Results:
${context}

Provide a concise, bulleted summary of the most critical regulatory, market, or operational risks disclosed by the company.`;

    if (!llm) {
      return { secFilings: "Mock SEC Filings:\n- Risk: Regulatory changes\n- Risk: Macroeconomic headwinds" };
    }

    const response = await llm.invoke([
      new SystemMessage("You are an expert financial auditor."),
      new HumanMessage(prompt)
    ]);

    const result = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return { secFilings: result };
  } catch (error) {
    console.error("SEC Filings Agent error:", error);
    return { secFilings: "Failed to fetch SEC filings data due to an error." };
  }
}
