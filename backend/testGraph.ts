import { graph } from './src/graph/graph';

async function main() {
  console.log("Starting linear graph execution...");
  const finalState = await graph.invoke({ companyName: "TestCompany" });
  console.log("Execution complete!");
  console.log("Final verdict:", finalState.decision?.verdict);
  console.log("Scores:", finalState.scores);
}

main().catch(console.error);
