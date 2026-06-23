import { ResearchState } from '../state';
import { newsSearchTool } from '../../tools/newsSearchTool';
import { getLLM } from '../llm';
import { z } from "zod";

const SentimentSchema = z.object({
  sentimentScore: z.number().min(0).max(1).describe("Sentiment score from 0 (very negative) to 1 (very positive).")
});

export const newsSentimentAgent = async (state: ResearchState): Promise<Partial<ResearchState>> => {
  console.log('Running newsSentimentAgent...');
  let errors: string[] = [];
  let missingData: string[] = [];
  let citations = state.citations || [];

  try {
    const query = state.resolvedEntity?.legalName || state.companyName;
    const articles = await newsSearchTool(query);
    
    if (articles.length === 0) {
      missingData.push("news");
      return { 
        newsSentiment: { articles: [], sentimentScore: 0.5 },
        missingData
      };
    }

    citations.push({
      source: "NewsAPI",
      description: `Recent news articles for ${query}`
    });

    const llm = getLLM();
    if (!llm) {
      return { 
        newsSentiment: { articles, sentimentScore: 0.8 },
        citations
      };
    }

    const modelWithStructure = llm.withStructuredOutput(SentimentSchema, { name: "news_sentiment" });
    const prompt = `Analyze the sentiment of the following news articles about ${query}. Provide a sentiment score between 0 (very negative) and 1 (very positive).\n\nArticles:\n${articles.join('\n')}`;
    
    const result = await modelWithStructure.invoke(prompt);
    
    return { 
      newsSentiment: {
        articles,
        sentimentScore: result.sentimentScore
      },
      citations
    };
  } catch (error: any) {
    console.error("Error in newsSentimentAgent:", error);
    errors.push(`newsSentimentAgent failed: ${error.message}`);
    missingData.push("news");
    return { errors, missingData };
  }
};
