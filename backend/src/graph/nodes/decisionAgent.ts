import { ResearchState } from '../state';
import { getLLM } from '../llm';
import { z } from "zod";

const DecisionSchema = z.object({
  verdict: z.enum(["INVEST", "PASS"]).describe("The final investment verdict"),
  confidence: z.number().min(0).max(100).describe("Confidence score between 0.0 and 1.0 (e.g. 0.82). Some models return whole numbers like 82 — that is also acceptable and will be normalized."),
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

  const scoresStr = state.scores
    ? `Financial Health: ${state.scores.financialHealth}/10 | Growth: ${state.scores.growthPotential}/10 | Moat: ${state.scores.moat}/10 | Sentiment: ${state.scores.marketSentiment}/10 | Risk: ${state.scores.riskLevel}/10`
    : "Scores not available.";

  const modelWithStructure = llm.withStructuredOutput(DecisionSchema, { name: "make_decision" });
  const prompt = `You are a senior hedge fund portfolio manager making a final INVEST or PASS decision for ${state.resolvedEntity?.legalName || state.companyName}.

RESEARCH BRIEF:
${state.researchBrief || "No brief available."}

SCORES: ${scoresStr}

MACRO CONTEXT:
${state.macroContext ? state.macroContext.substring(0, 500) : "Not provided."}

TASK: Write a structured investment decision. Your "reasoning" field must be a markdown string with ALL FIVE sections below. Write actual content — never write placeholder text like "[argument here]".

## 1. Analyst Debate
Write one or two real sentences for each perspective based on the research data above:
- **Bull Case**: Write the strongest reason to invest, citing specific data points.
- **Bear Case**: Write the strongest reason NOT to invest, citing specific risks.
- **Neutral View**: Write a balanced, hedged perspective that acknowledges both sides.

## 2. Rationale
In 2-3 sentences, explain which case is most compelling and why you are making this decision.

## 3. Trade Plan
- Entry: State where to buy (specific price range, or "at current market price")
- Add more: State the price level to add to the position
- Stop-loss: State the specific risk limit / exit level

## 4. Historical Parallel
Name one past market situation this resembles (e.g. "Similar to Amazon's 2015 dip before AWS growth became apparent") and the lesson it teaches.

## 5. Final Thesis
One punchy, memorable sentence summarizing the trade.

Fill in the schema: verdict (INVEST or PASS), confidence (0.0-1.0), the full markdown reasoning above, keyRisks (list 3), keyOpportunities (list 3), entryPoint, exitPoint, shortTermStrategy, longTermStrategy.`;
  
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
