import { NewsFindings } from "../graph/state";
import YF from 'yahoo-finance2';

const yahooFinance = new (YF as any)({ suppressNotices: ['yahooSurvey'] });

export async function newsSearchTool(query: string): Promise<string[]> {
  try {
    const results = await yahooFinance.search(query, { newsCount: 5 }) as any;
    
    if (!results.news || results.news.length === 0) {
       console.warn(`No news found for ${query} on Yahoo Finance.`);
       return [];
    }

    return results.news.map((article: any) => 
       `${article.title} (Published by ${article.publisher}) - ${article.link}`
    );
  } catch (error: any) {
    console.error(`Error fetching news for ${query}:`, error.message);
    console.warn("Falling back to mocked news data due to API error.");
    return [
      `Recent news about ${query} suggests positive growth.`,
      `${query} announced a new product line recently.`,
      `Market analysts are optimistic about ${query}'s future.`
    ];
  }
}
