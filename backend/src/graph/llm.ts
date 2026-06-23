import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

export const getLLM = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key') {
     console.warn("Using mock LLM responses since no real GROQ_API_KEY is provided.");
     return null;
  }
  return new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    apiKey: apiKey,
  });
};
