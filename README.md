# AI Investment Research Agent

A full-stack, multi-agent AI pipeline built to perform deep fundamental, news, and competitor analysis on a given company and produce a final INVEST or PASS decision with reasoning and confidence scores.

## Architecture & Tech Stack

**Backend**
- Node.js, Express, TypeScript
- **LangGraph** (`@langchain/langgraph`) for stateful orchestration of the multi-agent system.
- **Anthropic Claude 3.5 Sonnet** as the core reasoning engine.
- **PostgreSQL** + **Prisma ORM** for persistence and Long-term memory.
- **pgvector** for conversational memory and follow-up Q&A retrieval.
- Server-Sent Events (SSE) for real-time streaming of pipeline progress.
- External tools: Tavily (Web Search), Alpha Vantage (Financials), NewsAPI (News & Sentiment).

**Frontend**
- React, Vite, TypeScript
- Tailwind CSS for modern, dashboard-like styling.
- Recharts for data visualization.

---

## Setup & Local Development

### 1. Prerequisites
- Node.js (v18+)
- Docker (for local Postgres setup)

### 2. Backend Setup
1. Navigate to `backend/`
2. Run `npm install`
3. Start the local database: `docker-compose up -d`
4. Copy environment variables: `cp .env.example .env` and fill in your API keys (Anthropic, Tavily, Alpha Vantage, NewsAPI).
5. Apply database migrations and generate Prisma client:
   ```bash
   npx prisma migrate dev
   ```
   *(Note: The initial migration includes the setup for `pgvector`.)*
6. Start the server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:4000`.*

### 3. Frontend Setup
1. Navigate to `frontend/`
2. Run `npm install`
3. Ensure `.env` or `.env.local` is set with `VITE_API_URL=http://localhost:4000/api` (if running backend on a different port).
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

---

## Deployment Strategy

### Why not Vercel for Backend?
Vercel's serverless functions have strict execution timeout limits (typically 10-60 seconds depending on the plan). LangGraph agent pipelines, web scraping, and multiple LLM calls can easily take several minutes. Furthermore, Server-Sent Events (SSE) for real-time progress updates require long-lived connections which do not play well with standard serverless function limitations. 

Therefore, the backend is designed to be deployed on a platform supporting long-running Node.js processes, such as **Render**.

### Backend Deployment (Render)
1. Use the provided `render.yaml` configuration file (or create a Web Service manually).
2. Set the `Build Command` to `npm install && npx prisma generate && npx tsc`.
3. Set the `Start Command` to `node dist/server.js`.
4. Ensure all environment variables (including `DATABASE_URL` pointing to Neon) are added to the Render dashboard.

### Database Deployment (Neon)
1. Create a project on Neon.tech.
2. The agent requires the `pgvector` extension. Neon supports this natively.
3. Run `npx prisma migrate deploy` in your CI/CD pipeline or manually to push the schema to Neon.

### Frontend Deployment (Vercel)
1. Use the provided `vercel.json` (if any routing overrides are needed) or simply connect the GitHub repo.
2. Ensure the Framework Preset is set to Vite.
3. Set the Environment Variable `VITE_API_URL` to point to the deployed Render backend URL.