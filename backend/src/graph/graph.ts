import { StateGraph, START, END } from "@langchain/langgraph";
import { ResearchStateAnnotation, ResearchState } from "./state";
import { resolveEntity } from "./nodes/resolveEntity";
import { webResearchAgent } from "./nodes/webResearchAgent";
import { financialDataAgent } from "./nodes/financialDataAgent";
import { newsSentimentAgent } from "./nodes/newsSentimentAgent";
import { competitorAgent } from "./nodes/competitorAgent";
import { aggregator } from "./nodes/aggregator";
import { analystAgent } from "./nodes/analystAgent";
import { reflectionAgent } from "./nodes/reflectionAgent";
import { decisionAgent } from "./nodes/decisionAgent";
import { reportGenerator } from "./nodes/reportGenerator";

function routeAfterReflection(state: ResearchState): string {
  if (state.iterationCount >= 2) return "decisionAgent";
  if (state.missingData.includes("financials")) return "financialDataAgent";
  if (state.missingData.includes("news")) return "newsSentimentAgent";
  if (state.confidence < 0.6) return "webResearchAgent";
  return "decisionAgent";
}

const builder = new StateGraph(ResearchStateAnnotation)
  .addNode("resolveEntity", resolveEntity)
  .addNode("webResearchAgent", webResearchAgent)
  .addNode("financialDataAgent", financialDataAgent)
  .addNode("newsSentimentAgent", newsSentimentAgent)
  .addNode("competitorAgent", competitorAgent)
  .addNode("aggregator", aggregator)
  .addNode("analystAgent", analystAgent)
  .addNode("reflectionAgent", reflectionAgent)
  .addNode("decisionAgent", decisionAgent)
  .addNode("reportGenerator", reportGenerator)

  .addEdge(START, "resolveEntity")
  // Parallel Fan-Out
  .addEdge("resolveEntity", "webResearchAgent")
  .addEdge("resolveEntity", "financialDataAgent")
  .addEdge("resolveEntity", "newsSentimentAgent")
  .addEdge("resolveEntity", "competitorAgent")
  // Fan-In
  .addEdge("webResearchAgent", "aggregator")
  .addEdge("financialDataAgent", "aggregator")
  .addEdge("newsSentimentAgent", "aggregator")
  .addEdge("competitorAgent", "aggregator")
  // Linear progression
  .addEdge("aggregator", "analystAgent")
  .addEdge("analystAgent", "reflectionAgent")
  // Conditional Routing
  .addConditionalEdges("reflectionAgent", routeAfterReflection, {
    "decisionAgent": "decisionAgent",
    "financialDataAgent": "financialDataAgent",
    "newsSentimentAgent": "newsSentimentAgent",
    "webResearchAgent": "webResearchAgent"
  })
  .addEdge("decisionAgent", "reportGenerator")
  .addEdge("reportGenerator", END);

export const graph = builder.compile();
