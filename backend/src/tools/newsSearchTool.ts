import { NewsFindings } from "../graph/state";

export async function newsSearchTool(query: string): Promise<string[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey || apiKey === 'your_newsapi_key') {
    console.warn("NewsAPI key missing, returning mocked news data for", query);
    return [
      `Recent news about ${query} suggests positive growth.`,
      `${query} announced a new product line recently.`,
      `Market analysts are optimistic about ${query}'s future.`
    ];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Sort by relevancy to get the most relevant news
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
       return [];
    }

    return data.articles.map((article: any) => 
       `${article.title} - ${article.description}`
    );
  } catch (error: any) {
    console.error(`Error fetching news for ${query}:`, error.message);
    throw new Error(`News fetch failed: ${error.message}`);
  }
}
