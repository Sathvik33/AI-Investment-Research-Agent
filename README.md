<div align="center">

<br/>

# AI Investment Research Agent
### *Autonomous, Multi-Agent Hedge Fund Analyst — Powered by LangGraph & Groq*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/) [![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://github.com/langchain-ai/langgraphjs) [![Groq](https://img.shields.io/badge/Groq-f55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/) [![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

<br/>

> **A agentic workflow that simulates a Wall Street research desk.** <br/>Type a company name, watch specialized AI agents collaborate in real-time, and get an institutional-grade investment report backed by live market data.

<br/>

---

</div>

## 📖 Table of Contents
1. [Platform Overview](#-platform-overview)
2. [Agentic Architecture & Workflow](#-agentic-architecture--workflow)
3. [Deep Dive: The 9 Agents](#-deep-dive-the-9-agents)
4. [Tech Stack](#-tech-stack)
5. [Local Development Setup](#-local-development-setup)
6. [Industry Deployment Guide (AWS EC2 + Docker)](#-industry-deployment-guide-aws-ec2--docker)

---

## 🚀 Platform Overview

**AI Investment Research Agent** is a full-stack, event-driven application built to demonstrate the power of specialized multi-agent systems. 

Instead of relying on a single monolithic prompt, this system orchestrates a **directed acyclic graph (DAG)** of highly-specialized AI agents. These agents run concurrently, pull live data via API tools (Yahoo Finance, Tavily), synthesize data, self-reflect on their findings, and conduct a simulated debate to generate a final `INVEST` or `PASS` verdict.

### Key Capabilities
- **Parallel Fan-Out Execution:** 6 data-gathering agents execute simultaneously, drastically reducing wait times.
- **Self-Reflection Loop:** The graph features cyclic routing; if the `reflectionAgent` detects low confidence or missing data (e.g., failed to fetch financials), it automatically loops back to the necessary data-gathering agents to retry.
- **3-Persona Debate Engine:** The `decisionAgent` simulates a debate between a *Risk-Averse*, *Growth-Oriented*, and *Neutral* analyst to reduce AI hallucination and bias.
- **Real-Time Streaming:** Leveraging Server-Sent Events (SSE), the backend streams the graph's execution state directly to the React frontend, providing a live "thought process" UI.
- **One-Click PDF Export:** Export the final AI-generated markdown research report directly into a clean, styled PDF for seamless offline sharing.

---

## 🧠 Agentic Architecture & Workflow

The core of the backend is built on [LangGraph.js](https://github.com/langchain-ai/langgraphjs), defining a strict state machine for the agents to traverse.

### The LangGraph Workflow

```mermaid
graph TD
    User(["User Requests Research"]) --> resolve["resolveEntity"]
    
    resolve -->|"Identifies Entity"| fanoutNode(("Parallel Fan-Out"))
    fanoutNode --> web["webResearchAgent"]
    fanoutNode --> fin["financialDataAgent"]
    fanoutNode --> news["newsSentimentAgent"]
    fanoutNode --> comp["competitorAgent"]
    fanoutNode --> sec["secFilingsAgent"]
    fanoutNode --> macro["macroAgent"]
    
    web -->|"Tavily Scraping"| agg["aggregator"]
    fin -->|"Yahoo Finance API"| agg
    news -->|"Tavily News API"| agg
    comp -->|"Market Rival Analysis"| agg
    sec -->|"SEC 10-K/10-Q Parsing"| agg
    macro -->|"Macroeconomic Data"| agg
    
    agg -->|"Synthesized Brief"| analyst["analystAgent"]
    analyst -->|"5-Dimension Scoring"| reflect{"reflectionAgent"}
    
    reflect -->|"Missing Data / Low Confidence"| fanoutNode
    reflect -->|"High Confidence"| debate["decisionAgent"]
    
    debate -->|"Debate & Verdict"| report["reportGenerator"]
    report -->|"Persist to Postgres + SSE Stream"| Done(["Final Output"])
```

---

## 🕵️ Deep Dive: The Agents

Each agent is an independent Node in the LangGraph, operating on a shared `ResearchState` object.

| Agent Node | Core Responsibility | Output Artifact |
|---|---|---|
| **`resolveEntity`** | Disambiguates user input into a formal legal name, industry, and exact stock ticker. | `resolvedEntity` |
| **`webResearchAgent`** | Scrapes the web for business models, recent partnerships, and overarching company strategy. | `webResearch` |
| **`financialDataAgent`** | Triggers the `yahoo-finance2` tool to fetch live balance sheets, PE ratios, and margins. | `financialData` |
| **`newsSentimentAgent`** | Pulls the last 30 days of news and applies NLP scoring to determine market sentiment (Bullish/Bearish). | `newsSentiment` |
| **`competitorAgent`** | Identifies the top 3-5 market rivals and compares market positioning. | `competitors` |
| **`secFilingsAgent`** | Live targets `sec.gov` to extract recent 10-K and 10-Q risk factors and business disclosures. | `secFilings` |
| **`macroAgent`** | Evaluates global macroeconomic trends (e.g., inflation, geopolitical events) affecting the industry. | `macroContext` |
| **`aggregator`** | Fan-in node. Reduces the parallel data streams into a cohesive `researchBrief`. | `researchBrief` |
| **`analystAgent`** | Grades the company from 0-10 across 5 metrics: Health, Growth, Moat, Sentiment, and Risk. | `scores` |
| **`reflectionAgent`** | **Conditional Router**. Inspects the `researchBrief` for hallucinations or missing sections. Loops back if `confidence < 0.6`. | *Graph Routing* |
| **`decisionAgent`** | Synthesizes the debate into a final `INVEST` or `PASS` verdict with a concrete strategy. | `decision` |
| **`reportGenerator`** | Formats the final markdown report and persists the entire state tree to PostgreSQL via Prisma. | *Database Write* |

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Node.js + Express.js + TypeScript
- **AI Orchestration**: LangGraph.js + LangChain
- **LLM Provider**: Groq (`llama-3.3-70b-versatile`) for sub-second inference.
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Containerization**: Docker

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (for live stock data visualization)
- **Deployment**: Vercel

---

## 📂 Project Directory Structure

```text
AI-Investment-Research-Agent/
├── backend/
│   ├── src/
│   │   ├── graph/             # LangGraph Engine
│   │   │   ├── nodes/         # 9 AI Agent Definitions
│   │   │   ├── graph.ts       # DAG Routing & Pipeline
│   │   │   ├── llm.ts         # Groq LLM Config
│   │   │   └── state.ts       # Shared Graph State
│   │   ├── tools/             # Live Data API Tools (Yahoo, Tavily)
│   │   ├── routes/            # Express REST & SSE Endpoints
│   │   ├── middleware/        # Rate Limiting & Auth
│   │   └── server.ts          # Express App Entry Point
│   ├── prisma/                # PostgreSQL Schema & Migrations
│   ├── Dockerfile             # AWS Deployment Container
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/        # UI Components & Markdown Renderer
    │   ├── lib/               # API Clients & SSE Listeners
    │   ├── pages/             # Dashboard, Report, History Views
    │   └── App.tsx            # React Router
    ├── index.html
    └── package.json
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js v20+
- [Groq API Key](https://console.groq.com/)
- [Tavily API Key](https://tavily.com/)
- PostgreSQL Database (e.g., [Neon](https://neon.tech/))

### 1. Clone & Install
```bash
git clone https://github.com/Sathvik33/AI-Investment-Research-Agent.git
cd AI-Investment-Research-Agent

# Backend
cd backend && npm install
cp .env.example .env

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/db"
TAVILY_API_KEY="tvly-..."
GROQ_API_KEY="gsk_..."
PORT=4000
```

### 3. Run the Stack
```bash
# Terminal 1: Backend
cd backend && npx prisma migrate deploy && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

> **💡 Pro Tip: Local LLMs**: 
> You can swap out `ChatGroq` for `ChatOllama` in `backend/src/graph/llm.ts` to use a local model like `qwen2.5:7b` during local development to save on API tokens!

> **💡 Pro Tip: Market Data APIs**:
> The project defaults to `yahoo-finance2` because it is completely free and great for local development. However, Yahoo Finance frequently blocks cloud IPs (like AWS/Vercel). If you move to production, you may need to swap the `financialDataAgent` to use a paid tier of TwelveData or Alpha Vantage.

---

## 🌍 Industry Deployment Guide (AWS EC2 + Docker + Vercel)

This guide walks through deploying the backend securely to an AWS EC2 instance using Docker, AWS ECR, and NGINX for SSL termination, and hosting the frontend on Vercel.

### Phase 1: Deploy Frontend to Vercel
1. Update `API_URL` in `frontend/src/lib/api.ts` to point to your future backend URL (e.g., `https://investment-research.remotewire.net/api`).
2. Push your code to GitHub.
3. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
4. Import your GitHub repository, set the **Framework Preset** to Vite, and set the **Root Directory** to `frontend`.
5. Click **Deploy**. Your frontend is now live!

### Phase 2: Push Backend to AWS ECR
1. Create a private repository in **AWS ECR** (Elastic Container Registry).
2. On your local machine, authenticate and push the Docker image:
```bash
# Login to AWS ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <YOUR_AWS_ID>.dkr.ecr.ap-south-1.amazonaws.com

# Build the Image
docker build -t financial-researcher .

# Tag & Push
docker tag financial-researcher:latest <YOUR_AWS_ID>.dkr.ecr.ap-south-1.amazonaws.com/financial-researcher:latest
docker push <YOUR_AWS_ID>.dkr.ecr.ap-south-1.amazonaws.com/financial-researcher:latest
```

### Phase 3: Provision EC2 & Security Groups
1. Launch an **Ubuntu EC2 instance** in AWS.
2. Under **Security Groups**, add the following Inbound Rules:
   - **Port 22 (SSH)**: Set Source to *My IP*
   - **Port 80 (HTTP)**: Set Source to *0.0.0.0/0*
   - **Port 443 (HTTPS)**: Set Source to *0.0.0.0/0*

### Phase 4: Setup EC2 Environment
SSH into your EC2 instance and install the required infrastructure:
```bash
# 1. Install AWS CLI
sudo snap install aws-cli --classic

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 3. Install NGINX & Certbot (for SSL)
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```
*(Note: Type `exit` and SSH back in so your user inherits the Docker permissions).*

### Phase 5: Run the Backend Container
Create your `.env` file on the server, log in to ECR, and launch the container:
```bash
# Create ENV file
nano .env  # Paste your DB and API keys here

# Login & Pull
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <YOUR_AWS_ID>.dkr.ecr.ap-south-1.amazonaws.com
docker pull <YOUR_AWS_ID>.dkr.ecr.ap-south-1.amazonaws.com/financial-researcher:latest

# Run the Container (Binding to port 4000)
docker run -d \
  --name financial-backend \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file .env \
  <YOUR_AWS_ID>.dkr.ecr.ap-south-1.amazonaws.com/financial-researcher:latest
```

### Phase 6: NGINX Reverse Proxy & SSL (Certbot)
To accept secure `https://` requests from your frontend, route traffic through NGINX.
1. Point your domain (e.g., via Dynu/DuckDNS) to your **EC2 Public IPv4 Address**.
2. Edit the NGINX config:
```bash
sudo nano /etc/nginx/sites-available/default
```
3. Paste this configuration (ensuring SSE streaming works):
```nginx
server {
    server_name """REPLACE WITH YOUR DOMAIN""";

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Ensure Server-Sent Events (SSE) stream perfectly
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```
4. Restart NGINX and secure the server with an SSL certificate:
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d investment-research.remotewire.net
```

🎉 **Your full-stack application is now deployed and secure!** 

---

## License

Apache 2.0 License - open source and free for personal and commercial use.

<div align="center">

Built with love using LangGraph, Groq, and React

*Type a company. Get alpha.*

</div>