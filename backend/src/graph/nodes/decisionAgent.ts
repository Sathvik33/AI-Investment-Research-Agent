import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { z } from "zod";

const DecisionSchema = z.object({
  verdict: z.enum(["INVEST", "PASS"]).describe("The final investment verdict"),
  confidence: z.number().min(0).max(100).describe("Confidence in the verdict as a decimal between 0.0 and 1.0 (e.g. 0.85, NOT 85)"),
  reasoning: z.string().describe("Detailed paragraph explaining the reasoning behind the verdict"),
  keyRisks: z.array(z.string()).describe("List of key risks associated with this investment"),
  keyOpportunities: z.array(z.string()).describe("List of key opportunities or bullish factors"),
  entryPoint: z.string().describe("Recommended entry price or price range, e.g. '$150-$155' or 'Current Market Price'"),
  exitPoint: z.string().describe("Recommended exit price, take-profit, or stop-loss level, e.g. 'Below $140' or '$180'"),
  shortTermStrategy: z.string().describe("Short-term trading strategy (1-3 months), e.g. 'Hold through earnings' or 'Buy the dip'"),
  longTermStrategy: z.string().describe("Long-term investment strategy (1-5 years), e.g. 'Accumulate on weakness' or 'Avoid due to fundamentals'"),
});

export const decisionAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running decisionAgent...');
  const llm = getLLM();
  if (!llm) {
    return { 
      decision: { 
        verdict: "INVEST", 
        confidence: 0.9, 
        reasoning: "Mock reasoning. Looks like a solid investment based on mock data.", 
        keyRisks: ["Mock Risk A"], 
        keyOpportunities: ["Mock Opportunity A"],
        entryPoint: "$100",
        exitPoint: "$120",
        shortTermStrategy: "Hold",
        longTermStrategy: "Accumulate"
      }
    };
  }

  const modelWithStructure = llm.withStructuredOutput(DecisionSchema, { name: "make_decision" });
  const prompt = `You are the ultimate Risk Management Judge and Debate Facilitator for a top-tier hedge fund. Your job is to synthesize all research and scores into a final INVEST or PASS decision for ${state.resolvedEntity?.legalName || state.companyName}.

Research Brief:
${state.researchBrief}

Scores:
${JSON.stringify(state.scores)}

CRITICAL INSTRUCTION: Your 'reasoning' field MUST be a detailed, rich Markdown string structured EXACTLY as follows:

1. Summary of Key Arguments
Provide a debate between three personas based on the data:
- Risky Analyst: (Bullish perspective, focusing on growth and momentum)
- Safe Analyst: (Bearish perspective, focusing on risks, valuation, and volatility)
- Neutral Analyst: (Pragmatic perspective, focusing on levels and hedges)

2. Rationale for Decision
Explain which arguments carry the most weight based on the company's fundamentals and market environment. Why are you overriding the other concerns?

3. Refined Trader's Plan (The "Calculated Move")
Provide actionable steps such as:
- Immediate Engagement: (e.g. Initiate X% position at current levels)
- The Pivot Load: (Where to add more)
- The Volatility Buffer: (Where to reserve capital for dips)

4. Learning from Past Mistakes
Relate this setup to historical market traps (e.g. waiting too long for a dip, or setting stops too tight) and how this plan avoids them.

5. Conclusion
A final, punchy summary of the trade thesis.

Provide the verdict, your confidence level, this detailed markdown reasoning, key risks, opportunities, and the specific entry/exit and strategy fields requested by the schema.`;
  
  try {
    const result = await modelWithStructure.invoke(prompt);
    if (result.confidence > 1) {
      result.confidence = result.confidence / 100;
    }
    return { decision: result };
  } catch (error: any) {
    console.error("Error in decisionAgent:", error);
    return { errors: [`decisionAgent failed: ${error.message}`] };
  }
};
