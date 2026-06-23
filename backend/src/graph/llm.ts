import { ChatOllama } from "@langchain/ollama";

export const getLLM = (modelName: string = "qwen2.5:7b") => {
  return new ChatOllama({
    baseUrl: "http://localhost:11434", // Default local Ollama URL
    model: modelName,
    temperature: 0,
  });
};
