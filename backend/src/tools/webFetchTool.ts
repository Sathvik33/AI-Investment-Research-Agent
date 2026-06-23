import * as cheerio from 'cheerio';

export async function webFetchTool(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and non-content elements
    $('script, style, noscript, iframe, img, svg, video, audio, header, footer, nav').remove();

    // Extract text and clean it up
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate to avoid massive payloads (approx 10k chars max)
    return text.substring(0, 10000);
  } catch (error: any) {
    console.error(`Error fetching ${url}:`, error.message);
    return "";
  }
}
