import { Annotation } from "@langchain/langgraph";

export interface WebFindings {
  summary: string;
  recentDevelopments: string[];
}

export interface FinancialFindings {
  revenue: number;
  growth: number;
  profitability: string;
  isApplicable: boolean;
}

export interface NewsFindings {
  articles: string[];
  sentimentScore: number;
}

export interface CompetitorFindings {
  marketPosition: string;
  keyCompetitors: string[];
}

export interface Citation {
  source: string;
  url?: string;
  description: string;
}

export const ResearchStateAnnotation = Annotation.Root({
  companyName: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  resolvedEntity: Annotation<{
    legalName: string;
    domain?: string;
    ticker?: string;
    industry?: string;
    isPublic: boolean | string;
  } | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  webResearch: Annotation<WebFindings | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  financials: Annotation<FinancialFindings | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  newsSentiment: Annotation<NewsFindings | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  competitiveLandscape: Annotation<CompetitorFindings | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  secFilings: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  macroContext: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  researchBrief: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  citations: Annotation<Citation[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  scores: Annotation<{
    financialHealth: number;
    growthPotential: number;
    moat: number;
    marketSentiment: number;
    riskLevel: number;
  } | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  confidence: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  missingData: Annotation<string[]>({
    reducer: (x, y) => Array.from(new Set([...x, ...y])),
    default: () => [],
  }),
  iterationCount: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  decision: Annotation<{
    verdict: "INVEST" | "PASS";
    confidence: number;
    reasoning: string;
    keyRisks: string[];
    keyOpportunities: string[];
    entryPoint: string;
    exitPoint: string;
    shortTermStrategy: string;
    longTermStrategy: string;
  } | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  errors: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type ResearchState = typeof ResearchStateAnnotation.State;
