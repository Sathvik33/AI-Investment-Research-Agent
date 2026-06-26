import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export async function webSearchTool(query: string, maxResults = 5, includeDomains?: string[]): Promise<SearchResult[]> {
  if (process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key') {
    return runTavilySearch(query, maxResults, includeDomains);
  } else {
    return runDuckDuckGoSearch(query, maxResults, includeDomains);
  }
}

async function runTavilySearch(query: string, maxResults: number, includeDomains?: string[]): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const requestBody: any = {
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: maxResults
    };
    if (includeDomains && includeDomains.length > 0) {
        requestBody.include_domains = includeDomains;
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Tavily error: ${response.statusText}`);
    const data = await response.json();
    return data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Tavily search failed, falling back to DDG", error);
    return runDuckDuckGoSearch(query, maxResults);
  }
}

async function runDuckDuckGoSearch(query: string, maxResults: number, includeDomains?: string[]): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    let finalQuery = query;
    if (includeDomains && includeDomains.length > 0) {
      finalQuery += ' site:' + includeDomains.join(' OR site:');
    }
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalQuery)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`DDG error: ${response.statusText}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];
    $('.result').each((_, el) => {
      if (results.length >= maxResults) return;
      const title = $(el).find('.result__title .result__a').text().trim();
      let url = $(el).find('.result__title .result__a').attr('href') || '';
      const content = $(el).find('.result__snippet').text().trim();
      if (title && url && content) {
          // DDG urls are often wrapped in their own redirect, try to parse it
          if (url.startsWith('//duckduckgo.com/l/?')) {
             try {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const uddg = urlParams.get('uddg');
                if (uddg) url = uddg;
             } catch(e){}
          }
          results.push({ title, url, content });
      }
    });
    return results;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("DDG search error:", error);
    return [];
  }
}
