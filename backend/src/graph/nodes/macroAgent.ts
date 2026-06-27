import { getLLM } from '../llm';
import { ResearchState } from '../state';
import { webSearchTool } from '../../tools/webSearchTool';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export async function macroAgent(state: ResearchState): Promise<Partial<ResearchState>> {
  const industry = state.resolvedEntity?.industry || "the overall market";

  // Check LLM availability BEFORE making any expensive network calls
  const llm = getLLM();
  if (!llm) {
    return { macroContext: "Mock Macro Context: The current macroeconomic environment features elevated interest rates and geopolitical uncertainty, creating moderate headwinds for growth sectors but tailwinds for defensives." };
  }

  try {
    const currentYear = new Date().getFullYear();
    const query = `current global macroeconomic trends geopolitical events interest rates affecting ${industry} ${currentYear}`;
    const searchResults = await webSearchTool(query, 5);

    if (!searchResults || searchResults.length === 0) {
      return { macroContext: "No significant macroeconomic data found." };
    }

    const context = searchResults.map(r => `Title: ${r.title}\nSource: ${r.url}\nContent: ${r.content}`).join('\n\n');

    const prompt = `You are a Global Macroeconomic Strategist.
Analyze the following recent search results regarding the current macroeconomic, geopolitical, and industry-specific environment for: ${industry}.

Search Results:
${context}

Summarize the current market context (e.g., inflation, interest rates, wars, tech bubbles, supply chain issues) and how it creates headwinds or tailwinds for this industry. Keep it concise (1-2 paragraphs).`;

    const response = await llm.invoke([
      new SystemMessage("You are an expert Macroeconomic Strategist."),
      new HumanMessage(prompt)
    ]);

    const result = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return { macroContext: result };
  } catch (error) {
    console.error("Macro Agent error:", error);
    return { macroContext: "Failed to fetch macroeconomic context due to an error." };
  }
}
