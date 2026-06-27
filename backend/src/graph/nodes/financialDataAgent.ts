import { ResearchState } from '../state';
import { financialDataTool } from '../../tools/financialDataTool';

export const financialDataAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running financialDataAgent...');
  let errors: string[] = [];
  let missingData: string[] = [];
  let citations = state.citations || [];

  try {
    if (!state.resolvedEntity?.isPublic || !state.resolvedEntity?.ticker) {
      console.log('Company is private or lacks a ticker. Financial data not applicable.');
      return { 
        financials: { revenue: 0, growth: 0, profitability: "N/A", isApplicable: false } 
      };
    }

    const financials = await financialDataTool(state.resolvedEntity.ticker);
    
    if (financials.isApplicable) {
       citations.push({
         source: "Yahoo Finance",
         description: `Financial data for ${state.resolvedEntity.ticker}`
       });
    } else {
       missingData.push("financials");
    }

    return { 
      financials,
      citations,
      missingData
    };
  } catch (error: any) {
    console.error("Error in financialDataAgent:", error);
    errors.push(`financialDataAgent failed: ${error.message}`);
    missingData.push("financials");
    return { errors, missingData };
  }
};
