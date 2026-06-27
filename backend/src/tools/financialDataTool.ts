import { FinancialFindings } from "../graph/state";
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

export async function financialDataTool(ticker?: string): Promise<FinancialFindings> {
  if (!ticker) {
    return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
  }

  // Sanitize ticker: LLMs sometimes return verbose strings like
  // "RELIANCE.NS (National Stock Exchange of India), RELIANCE-IN (...)"
  // Extract just the first clean symbol before any space or parenthesis.
  const cleanTicker = ticker
    .split(/[\s\(,]/)[0]   // take first token before space, comma, or (
    .replace(/[^A-Z0-9.\-:]/gi, '') // strip any remaining non-symbol chars
    .trim();

  if (!cleanTicker) {
    console.warn(`Could not extract a clean ticker from: "${ticker}"`);
    return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
  }

  // automatically try NSE (.NS) and BSE (.BO) suffixes as fallbacks.
  const candidates: string[] = [cleanTicker];
  if (!cleanTicker.includes('.') && !cleanTicker.includes(':')) {
    candidates.push(`${cleanTicker}.NS`);  // NSE India
    candidates.push(`${cleanTicker}.BO`);  // BSE India
  }

  for (const symbol of candidates) {
    try {
      const quote = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics'] }) as any;
      
      if (!quote || !quote.financialData) {
        console.warn(`No financial data found for ${symbol}. Trying next candidate...`);
        continue;
      }

      const revenue = quote.financialData.totalRevenue || 0;
      const growth = (quote.financialData.revenueGrowth || 0) * 100;
      const profitability = (quote.financialData.profitMargins || 0) > 0 ? "Profitable" : "Unprofitable";

      console.log(`Financial data fetched successfully for ${symbol}`);
      return { revenue, growth, profitability, isApplicable: true };
    } catch (error: any) {
      console.warn(`Error fetching financial data for ${symbol}:`, error.message);
      // Continue to next candidate
    }
  }

  // All candidates failed — return gracefully so agent doesn't crash
  console.error(`All ticker candidates exhausted for original input: "${ticker}"`);
  return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
}

