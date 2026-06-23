import { FinancialFindings } from "../graph/state";

export async function financialDataTool(ticker?: string): Promise<FinancialFindings> {
  if (!ticker) {
    return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
  }

  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey || apiKey === 'your_alphavantage_api_key') {
    console.warn("Alpha Vantage API key missing, returning mocked financial data for", ticker);
    return {
      revenue: 1000000000,
      growth: 15.5,
      profitability: "Profitable",
      isApplicable: true
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Alpha Vantage returns empty object `{}` if symbol not found
    if (!data || Object.keys(data).length === 0 || data.Note) {
       console.warn(`No financial data found for ticker ${ticker}. Treating as private/inapplicable.`);
       return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
    }

    return {
      revenue: parseFloat(data.RevenueTTM) || 0,
      growth: parseFloat(data.QuarterlyRevenueGrowthYOY) * 100 || 0,
      profitability: parseFloat(data.ProfitMargin) > 0 ? "Profitable" : "Unprofitable",
      isApplicable: true
    };
  } catch (error: any) {
    console.error(`Error fetching financial data for ${ticker}:`, error.message);
    throw new Error(`Financial data fetch failed: ${error.message}`);
  }
}
