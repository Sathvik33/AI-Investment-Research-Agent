import { ChatGroq } from "@langchain/groq";
import * as dotenv from "dotenv";

dotenv.config();

export const getLLM = (modelName: string = "llama-3.3-70b-versatile") => {
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing. Please add it to your .env file.");
    return null;
  }
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: modelName,
    temperature: 0.2,
    maxRetries: 2,
  });
};
