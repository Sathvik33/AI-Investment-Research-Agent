<div align="center">

<br/>

# AI Investment Research Agent

### *A fully autonomous, multi-agent hedge fund analyst — powered by LangGraph & Groq*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://github.com/langchain-ai/langgraphjs)
[![Groq](https://img.shields.io/badge/Groq-f55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

<br/>

> **Type a company name. Watch 9 specialized AI agents collaborate in real-time. Get an institutional-grade investment report in minutes — for free, with zero rate limits.**

<br/>

---

</div>

## What Is This?

**AI Investment Research Agent** is a production-grade agentic application that simulates a Wall Street research desk. Instead of a single chatbot, it deploys a **graph of specialized AI agents** — each with a distinct role — that run in parallel, debate each other, self-reflect on their confidence, and deliver a final INVEST or PASS verdict backed by deep, structured reasoning.

The entire pipeline is powered by **Groq** using `llama-3.3-70b-versatile`, giving you **blazing fast** inference for near-instant, real-time analysis.

---

## Live Pipeline

```
User types: "Infosys"
     |
     v
[resolveEntity] --> Finds ticker, legal name & industry via LLM + web search
     |
     +---------------------------+--------------------+------------------+
     v                          v                    v                  v
[webResearchAgent]   [financialDataAgent]  [newsSentimentAgent]  [competitorAgent]
  Web scraping +      Yahoo Finance API     News NLP + scoring     Rival analysis
  business summary    live fundamentals     bullish/bearish         top 3-5 rivals
     |                          |                    |                  |
     +---------------------------+--------------------+------------------+
                                         v
                                   [aggregator]   <-- Synthesizes unified research brief
                                         v
                                  [analystAgent]  <-- Scores company across 5 dimensions
                                         v
                                [reflectionAgent] --- confidence < 60%? ---> loop back
                                         |
                                         v
                                 [decisionAgent]  <-- 3-persona debate: Risky vs Safe vs Neutral
                                         v
                                [reportGenerator] <-- Persists to PostgreSQL, streams to UI
```

---

## Key Features

| Feature | Description |
|---|---|
| **9 Specialized AI Agents** | Each agent has a single, focused responsibility — no monolithic prompts |
| **Parallel Fan-Out Architecture** | 4 research agents run simultaneously, dramatically cutting pipeline time |
| **Self-Reflection Loop** | The `reflectionAgent` re-triggers research if confidence falls below 60% |
| **3-Persona Debate Engine** | Risky, Safe, and Neutral analyst personas debate before issuing a verdict |
| **Live Stock Chart** | Real-time price chart pulled from Yahoo Finance via `yahoo-finance2` |
| **Multi-Currency Support** | Auto-detects INR (Rs.), EUR (Euro), GBP (GBP) for international stocks |
| **Follow-up Chat** | Conversational Q&A backed by the full research brief as context |
| **Blazing Fast AI** | Powered by Groq and Llama 3.3 70B for near-instant research generation |
| **Real-time SSE Streaming** | Agent progress streams live to the frontend via Server-Sent Events |
| **Persistent Reports** | All reports stored in PostgreSQL via Prisma — browse your full history |

---

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript + `ts-node-dev`
- **AI Orchestration**: [LangGraph.js](https://github.com/langchain-ai/langgraphjs)
- **LLM Provider**: [Groq](https://console.groq.com/) (`llama-3.3-70b-versatile`)
- **Web Search**: [Tavily API](https://tavily.com/) — grounded, citation-backed search
- **Financial Data**: `yahoo-finance2` — live price charts and fundamentals
- **Database**: PostgreSQL (via [Neon](https://neon.tech/)) + [Prisma ORM](https://www.prisma.io/) + `pgvector`
- **API Server**: Express.js with SSE streaming

### Frontend
- **Framework**: React 18 + TypeScript + [Vite](https://vitejs.dev/)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS — dark mode, glassmorphism
- **Charts**: [Recharts](https://recharts.org/) — interactive stock price visualization
- **Markdown**: `react-markdown` — rich report rendering

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Groq API Key** — [Get one free](https://console.groq.com/)
- **PostgreSQL** database — [Neon free tier](https://neon.tech/) recommended
- **Tavily API Key** — [Get one free](https://tavily.com/) (1,000 searches/month)

### 1. Clone the repository

```bash
git clone https://github.com/Sathvik33/AI-Investment-Research-Agent.git
cd AI-Investment-Research-Agent
```



### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Fill in your DATABASE_URL, TAVILY_API_KEY, and GROQ_API_KEY
```

### 3. Install dependencies and run migrations

```bash
# Backend
cd backend && npm install && npx prisma migrate deploy

# Frontend
cd ../frontend && npm install
```

### 4. Launch

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173** and type any company name!

---



---

## Agent Roles

| Agent | Role | Output |
|---|---|---|
| `resolveEntity` | Disambiguates name to ticker, legal name, industry | `resolvedEntity` |
| `webResearchAgent` | Scrapes and summarizes business overview and news | `webResearch` |
| `financialDataAgent` | Pulls live financials from Yahoo Finance | `financialData` |
| `newsSentimentAgent` | Scores headlines bullish/bearish | `newsSentiment` |
| `competitorAgent` | Identifies top 3-5 market rivals | `competitors` |
| `aggregator` | Synthesizes all research into a unified brief | `researchBrief` |
| `analystAgent` | Scores 5 dimensions: Health, Growth, Moat, Sentiment, Risk | `scores` |
| `reflectionAgent` | Reviews confidence; loops back if below 60% | routing |
| `decisionAgent` | 3-persona debate -> INVEST/PASS verdict + strategy | `decision` |
| `reportGenerator` | Persists to DB, streams final report to UI | database write |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `TAVILY_API_KEY` | Yes | Tavily web search API key |
| `GROQ_API_KEY` | Yes | Required for Groq fast inference |
| `PORT` | No | Backend port (default: `4000`) |
| `FRONTEND_ORIGIN` | No | CORS origin (default: `http://localhost:5173`) |

---

## 💡 Pro Tip: Local Testing vs Production

While **Groq** provides blazing-fast inference for production, you can easily swap the LLM provider to **Ollama** during development to save on API tokens and costs. 

To test locally:
1. Install [Ollama](https://ollama.ai/) and run `ollama pull qwen2.5:7b` (recommended for its great tool calling and reasoning).
2. Update `backend/src/graph/llm.ts` to use `ChatOllama` instead of `ChatGroq`.

Once your prompt engineering and agents are fully tested, switch back to Groq for lightning-fast production deployments!

---

## Project Structure

```
AI-Investment-Research-Agent/
+-- backend/
|   +-- src/
|   |   +-- graph/
|   |   |   +-- nodes/          # All 10 AI agent definitions
|   |   |   +-- graph.ts        # LangGraph pipeline definition
|   |   |   +-- llm.ts          # LLM provider (Groq)
|   |   |   +-- state.ts        # Shared state type definitions
|   |   +-- tools/              # webSearch, webFetch, financialData, newsSearch
|   |   +-- routes/             # Express REST + SSE endpoints
|   |   +-- db/                 # Prisma client & DB utilities
|   |   +-- server.ts           # Express app entry point
|   +-- prisma/
|   |   +-- schema.prisma       # Database schema
|   +-- .env.example
+-- frontend/
|   +-- src/
|   |   +-- pages/
|   |   |   +-- Home.tsx        # Company search & run creation
|   |   |   +-- Dashboard.tsx   # Live 3-column research dashboard
|   |   |   +-- Report.tsx      # Full report view
|   |   |   +-- History.tsx     # Past research run browser
|   |   +-- App.tsx
|   +-- vite.config.ts
+-- README.md
```

---

## License

Apache 2.0 License - open source and free for personal and commercial use.

---

<div align="center">

Built with love using LangGraph, Groq, and React

*Type a company. Get alpha.*

</div>