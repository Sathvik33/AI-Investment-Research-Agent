-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "ticker" TEXT,
    "industry" TEXT,
    "is_public" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_runs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_node" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "research_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_findings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "citations" JSONB NOT NULL,

    CONSTRAINT "research_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "key_risks" JSONB NOT NULL,
    "key_opportunities" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_embeddings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "embedding" vector(1536),
    "chunk_text" TEXT NOT NULL,

    CONSTRAINT "report_embeddings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_findings" ADD CONSTRAINT "research_findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "research_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "research_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "research_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_embeddings" ADD CONSTRAINT "report_embeddings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "research_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
