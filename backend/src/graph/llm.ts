import { ChatGroq } from "@langchain/groq";
import * as dotenv from "dotenv";
// import { ChatOllama } from "@langchain/ollama";

dotenv.config();

// For Local Development

// export const getLLM = (modelName: string = "qwen2.5:7b") => {
//   return new ChatOllama({
//     baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
//     model: modelName,
//     temperature: 0.2,
//   });
// };

// For Production
export const getLLM = (modelName: string = "meta-llama/llama-4-scout-17b-16e-instruct") => {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: modelName,
    temperature: 0.2,
    maxRetries: 2,
  });
};
