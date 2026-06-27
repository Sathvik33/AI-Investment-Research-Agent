import { StateGraph, START, END } from "@langchain/langgraph";
import { ResearchStateAnnotation, ResearchState } from "./state";
import { resolveEntity } from "./nodes/resolveEntity";
import { webResearchAgent } from "./nodes/webResearchAgent";
import { financialDataAgent } from "./nodes/financialDataAgent";
import { newsSentimentAgent } from "./nodes/newsSentimentAgent";
import { competitorAgent } from "./nodes/competitorAgent";
import { secFilingsAgent } from "./nodes/secFilingsAgent";
import { macroAgent } from "./nodes/macroAgent";
import { aggregator } from "./nodes/aggregator";
import { analystAgent } from "./nodes/analystAgent";
import { reflectionAgent } from "./nodes/reflectionAgent";
import { decisionAgent } from "./nodes/decisionAgent";
import { reportGenerator } from "./nodes/reportGenerator";
import { getCheckpointer } from "../db/checkpointer";

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
  .addNode("secFilingsAgent", secFilingsAgent)
  .addNode("macroAgent", macroAgent)
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
  .addEdge("resolveEntity", "secFilingsAgent")
  .addEdge("resolveEntity", "macroAgent")
  // Fan-In
  .addEdge("webResearchAgent", "aggregator")
  .addEdge("financialDataAgent", "aggregator")
  .addEdge("newsSentimentAgent", "aggregator")
  .addEdge("competitorAgent", "aggregator")
  .addEdge("secFilingsAgent", "aggregator")
  .addEdge("macroAgent", "aggregator")
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

/**
 * Lazy-compiled graph singleton.
 * On first call, attempts to compile WITH the PostgreSQL checkpointer for state persistence.
 * Falls back to an in-memory (no-persistence) compile if the DB is unavailable.
 */
let _graph: ReturnType<typeof builder.compile> | null = null;

export const getGraph = async (): Promise<ReturnType<typeof builder.compile>> => {
  if (_graph) return _graph;

  try {
    const checkpointer = await getCheckpointer();
    _graph = builder.compile({ checkpointer });
    console.log("Graph compiled with PostgreSQL checkpointer.");
  } catch (e) {
    console.warn("Checkpointer unavailable — compiling graph without state persistence:", e);
    _graph = builder.compile();
  }

  return _graph;
};
