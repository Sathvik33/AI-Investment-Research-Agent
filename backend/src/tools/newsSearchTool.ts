import YF from 'yahoo-finance2';

const customLogger = {
  ...console,
  warn: (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Unsupported environment')) return;
    console.warn(...args);
  }
};
const yahooFinance = new (YF as any)({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
  logger: customLogger 
});

/**
 * Fetches recent news articles for a given company/query from Yahoo Finance.
 * Returns an empty array on failure — callers should treat this as missing data
 * rather than substituting fabricated content.
 */
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
    return [];
  }
}
