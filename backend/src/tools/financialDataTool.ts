import { FinancialFindings } from "../graph/state";
import YF from 'yahoo-finance2';

const yahooFinance = new (YF as any)({ suppressNotices: ['yahooSurvey'] });

export async function financialDataTool(ticker?: string): Promise<FinancialFindings> {
  if (!ticker) {
    return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
  }

  try {
    const quote = await yahooFinance.quoteSummary(ticker, { modules: ['financialData', 'defaultKeyStatistics'] }) as any;
    
    if (!quote || !quote.financialData) {
       console.warn(`No financial data found for ticker ${ticker}. Treating as private/inapplicable.`);
       return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
    }

    const revenue = quote.financialData.totalRevenue || 0;
    const growth = (quote.financialData.revenueGrowth || 0) * 100;
    const profitability = (quote.financialData.profitMargins || 0) > 0 ? "Profitable" : "Unprofitable";

    return {
      revenue,
      growth,
      profitability,
      isApplicable: true
    };
  } catch (error: any) {
    console.error(`Error fetching financial data for ${ticker}:`, error.message);
    // Return gracefully instead of throwing so agent doesn't crash
    return { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false };
  }
}
