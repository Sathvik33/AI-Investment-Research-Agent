import { getLLM } from '../graph/llm';
import { prisma } from '../db/prisma';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { webSearchTool } from '../tools/webSearchTool';
import { financialDataTool } from '../tools/financialDataTool';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

const searchWeb = tool(async ({ query }) => {
  const res = await webSearchTool(query, 3);
  return JSON.stringify(res);
}, {
  name: "search_web",
  description: "Search the web for current events, news, or competitor information. Useful for comparing companies.",
  schema: z.object({ query: z.string() })
});

const getFinance = tool(async ({ ticker }) => {
  const data = await financialDataTool(ticker);
  return JSON.stringify(data);
}, {
  name: "get_financial_data",
  description: "Get real-time financial data, metrics, and stock price for a given ticker symbol (e.g. MSFT).",
  schema: z.object({ ticker: z.string() })
});

export async function runFollowupChain(runId: string, question: string): Promise<string> {
  const llm = getLLM();
  if (!llm) {
    return "Mock follow-up answer: I'm currently running in mock mode without API keys.";
  }

  try {
    // Save user message
    await prisma.message.create({
      data: { runId, role: "user", content: question }
    });

    const run = await prisma.researchRun.findUnique({
      where: { id: runId },
      include: { company: true, reports: true, messages: { orderBy: { createdAt: 'asc' } } }
    });

    const report = run?.reports[0];
    const brief = report ? report.reasoning : "No research brief found.";
    
    // Build message history with correct role types (AIMessage for assistant turns)
    const history = (run?.messages || []).map(m =>
      m.role === 'assistant'
        ? new AIMessage(m.content)
        : new HumanMessage(m.content)
    );

    const systemPrompt = `You are an AI Investment Research Agent. You just produced a report with the following reasoning:
${brief}

You have access to tools to look up other companies if the user asks for comparisons (e.g., fetching financial data or web searching). Use these tools if necessary to answer the user's question accurately. If they don't ask about another company, just answer based on the report context.`;

    const agent = createReactAgent({ llm, tools: [searchWeb, getFinance] });

    const result = await agent.invoke({
      messages: [
        new SystemMessage(systemPrompt),
        ...history,
        new HumanMessage(question)
      ]
    });

    const finalMessage = result.messages[result.messages.length - 1];
    const answer = typeof finalMessage.content === 'string' ? finalMessage.content : JSON.stringify(finalMessage.content);

    // Save assistant message
    await prisma.message.create({
      data: { runId, role: "assistant", content: answer }
    });

    return answer;
  } catch (error: any) {
    console.error("Follow-up chain error:", error);
    return "I encountered an error processing your question. Please ensure the database is connected.";
  }
}
