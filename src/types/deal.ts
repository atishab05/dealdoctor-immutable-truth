export type DealStage = 
  | "discovery" 
  | "demo" 
  | "proposal" 
  | "negotiation" 
  | "closed_won" 
  | "closed_lost";

export type DiagnosisCode = 
  | "SINGLE_THREADED"
  | "NO_ECONOMIC_BUYER"
  | "NO_BUSINESS_IMPACT"
  | "NO_NEW_VALUE"
  | "WEAK_URGENCY"
  | "SALES_PROCESS_GAPS";

export type Severity = "low" | "medium" | "high" | "critical";

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  email: string;
  role: "champion" | "economic_buyer" | "technical_buyer" | "influencer" | "blocker";
}

// Normalized signals pre-computed before rules run (per PRD)
export interface DealSignals {
  contactCount: number;
  decisionMakerPresent: boolean;
  crossFunctionalContactPresent: boolean;
  daysSinceLastActivity: number;
  daysInStage: number;
  nextStepScheduled: boolean;
  budgetDiscussed: boolean;
  metricsMentioned: boolean;
  newValueSentPostDemo: boolean;
  timelineDefined: boolean;
  consequenceOfInactionDefined: boolean;
  discoverySummaryPresent: boolean;
}

export interface RuleMatch {
  ruleId: string;
  severity: Severity;
}

export interface Diagnosis {
  code: DiagnosisCode;
  severity: Severity;
  confidence: number;
  evidence: string[];
  explanation: string;
  matchedRules: string[];
}

export interface RecommendedAction {
  id: string;
  action: string;
  playbook: string;
  reason: string;
  expectedImpact: "high" | "medium" | "low";
  timeToExecute: string;
  status: "pending" | "in_progress" | "completed";
}

export interface Deal {
  id: string;
  companyName: string;
  dealValue: number;
  stage: DealStage;
  daysInactive: number;
  stakeholders: Stakeholder[];
  notes: string;
  diagnosis: Diagnosis | null;
  recommendedActions: RecommendedAction[];
  createdAt: Date;
  lastActivityAt: Date;
  reminderDate: Date | null;
}

export const DIAGNOSIS_LABELS: Record<DiagnosisCode, string> = {
  SINGLE_THREADED: "Single-Threaded Deal",
  NO_ECONOMIC_BUYER: "No Economic Buyer",
  NO_BUSINESS_IMPACT: "No Clear Business Impact",
  NO_NEW_VALUE: "No New Value Introduced",
  WEAK_URGENCY: "Weak Urgency / Priority",
  SALES_PROCESS_GAPS: "Sales Process Gaps",
};

export const STAGE_LABELS: Record<DealStage, string> = {
  discovery: "Discovery",
  demo: "Demo",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};
