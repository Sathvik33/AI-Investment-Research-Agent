import { ChatGroq } from "@langchain/groq";
import * as dotenv from "dotenv";

dotenv.config();

// For Local Development

// export const getLLM = (modelName: string = "qwen2.5:7b") => {
//   return new ChatOllama({
//     baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
//     model: modelName,
//     temperature: 0.2,
//   });
// };

export const getLLM = (modelName: string = "llama-3.3-70b-versatile") => {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: modelName,
    temperature: 0.2,
    maxRetries: 2,
  });
};
