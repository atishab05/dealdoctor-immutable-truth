import { Deal, Diagnosis, DiagnosisCode, RecommendedAction } from "@/types/deal";
import { computeSignals } from "./signals";
import {
  evaluateRules,
  calculateConfidence,
  getHighestSeverity,
  collectEvidence,
  DIAGNOSIS_EXECUTION_ORDER,
} from "./rules";

/**
 * Deterministic diagnosis engine.
 * Implements exact rules from PRD - no LLM modifications allowed.
 * 
 * Execution order (per PRD):
 * 1. Sales Process Gaps - Hygiene issues distort all other signals
 * 2. Single-Threaded Deal - Structural blockers first
 * 3. No Economic Buyer
 * 4. No Clear Business Impact
 * 5. Weak Urgency
 * 6. No New Value Introduced - Messaging issues last
 * 
 * Returns: Primary diagnosis (highest priority) + secondary diagnoses
 */
export function diagnoseDeal(deal: Deal): Diagnosis | null {
  // Step 1: Compute normalized signals
  const signals = computeSignals(deal);

  // Step 2: Evaluate all rules
  const ruleMatches = evaluateRules(signals);

  if (ruleMatches.size === 0) {
    return null;
  }

  // Step 3: Build diagnoses sorted by execution order, severity, confidence
  const diagnoses: Diagnosis[] = [];

  for (const code of DIAGNOSIS_EXECUTION_ORDER) {
    const matches = ruleMatches.get(code);
    if (!matches || matches.length === 0) continue;

    const severity = getHighestSeverity(matches);
    const confidence = calculateConfidence(code, matches);
    const evidence = collectEvidence(matches);
    const matchedRules = matches.map((m) => m.ruleId);

    diagnoses.push({
      code,
      severity,
      confidence,
      evidence,
      explanation: generateExplanation(code, deal),
      matchedRules,
    });
  }

  if (diagnoses.length === 0) return null;

  // Step 4: Sort by severity, then execution order, then confidence
  const severityOrder = { high: 0, medium: 1, low: 2, critical: -1 };
  
  diagnoses.sort((a, b) => {
    // Primary: Severity
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;

    // Secondary: Execution order
    const orderDiff =
      DIAGNOSIS_EXECUTION_ORDER.indexOf(a.code) -
      DIAGNOSIS_EXECUTION_ORDER.indexOf(b.code);
    if (orderDiff !== 0) return orderDiff;

    // Tertiary: Confidence (higher first)
    return b.confidence - a.confidence;
  });

  // Return primary diagnosis
  return diagnoses[0];
}

/**
 * Get all diagnoses for a deal (primary + secondary).
 * Max 1 primary + up to 2 secondary per PRD.
 */
export function getAllDiagnoses(deal: Deal): Diagnosis[] {
  const signals = computeSignals(deal);
  const ruleMatches = evaluateRules(signals);

  if (ruleMatches.size === 0) return [];

  const diagnoses: Diagnosis[] = [];

  for (const code of DIAGNOSIS_EXECUTION_ORDER) {
    const matches = ruleMatches.get(code);
    if (!matches || matches.length === 0) continue;

    diagnoses.push({
      code,
      severity: getHighestSeverity(matches),
      confidence: calculateConfidence(code, matches),
      evidence: collectEvidence(matches),
      explanation: generateExplanation(code, deal),
      matchedRules: matches.map((m) => m.ruleId),
    });
  }

  // Sort and limit to 3 (1 primary + 2 secondary)
  const severityOrder = { high: 0, medium: 1, low: 2, critical: -1 };
  
  diagnoses.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    const orderDiff =
      DIAGNOSIS_EXECUTION_ORDER.indexOf(a.code) -
      DIAGNOSIS_EXECUTION_ORDER.indexOf(b.code);
    if (orderDiff !== 0) return orderDiff;
    return b.confidence - a.confidence;
  });

  return diagnoses.slice(0, 3);
}

function generateExplanation(code: DiagnosisCode, deal: Deal): string {
  const explanations: Record<DiagnosisCode, string> = {
    SINGLE_THREADED: `This deal at ${deal.companyName} is stuck because it depends on only one stakeholder. If they go dark, change roles, or lose internal influence, the deal dies. Multi-threading reduces single-point-of-failure risk.`,
    NO_ECONOMIC_BUYER: `No one with budget authority is engaged in the ${deal.companyName} deal. Without an economic buyer, you're building consensus without the person who signs the check.`,
    NO_BUSINESS_IMPACT: `The value of your solution hasn't been quantified for ${deal.companyName}. Without clear ROI or business impact, this becomes a "nice to have" rather than a must-have.`,
    NO_NEW_VALUE: `The ${deal.companyName} deal has stalled post-demo. You need to introduce fresh value—a new angle, customer proof point, or insight—to reignite momentum.`,
    WEAK_URGENCY: `There's no compelling event or deadline pushing ${deal.companyName} to act. Without urgency, deals slip quarter after quarter.`,
    SALES_PROCESS_GAPS: `Key sales process steps are missing in the ${deal.companyName} deal. Before any outreach, ensure discovery is documented and next steps are clear.`,
  };
  return explanations[code];
}

/**
 * Generate recommended actions based on diagnosis.
 * Maps diagnosis to playbooks from PRD.
 */
export function generateActions(diagnosis: Diagnosis, deal: Deal): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  switch (diagnosis.code) {
    case "SINGLE_THREADED":
    case "NO_ECONOMIC_BUYER":
      actions.push({
        id: crypto.randomUUID(),
        action: "Multi-thread the deal",
        playbook: "Multi-Thread",
        reason: "Find Finance, Ops, or VP-level contacts to reduce single-point failure risk",
        expectedImpact: "high",
        timeToExecute: "2-3 days",
        status: "pending",
      });
      actions.push({
        id: crypto.randomUUID(),
        action: "Request warm intro from existing contact",
        playbook: "Multi-Thread",
        reason: "Leverage your champion to reach the economic buyer",
        expectedImpact: "high",
        timeToExecute: "1 day",
        status: "pending",
      });
      break;

    case "NO_BUSINESS_IMPACT":
    case "WEAK_URGENCY":
      actions.push({
        id: crypto.randomUUID(),
        action: "Re-anchor on business impact",
        playbook: "Business Impact",
        reason: "Generate industry benchmarks and cost-of-inaction framing",
        expectedImpact: "high",
        timeToExecute: "1-2 days",
        status: "pending",
      });
      actions.push({
        id: crypto.randomUUID(),
        action: "Create urgency with deadline",
        playbook: "Create Urgency",
        reason: "Reframe around upcoming deadline or competitive pressure",
        expectedImpact: "medium",
        timeToExecute: "1 day",
        status: "pending",
      });
      break;

    case "NO_NEW_VALUE":
      actions.push({
        id: crypto.randomUUID(),
        action: "Share new customer example or insight",
        playbook: "New Value",
        reason: "Introduce fresh perspective to restart momentum",
        expectedImpact: "medium",
        timeToExecute: "1 day",
        status: "pending",
      });
      actions.push({
        id: crypto.randomUUID(),
        action: "Expand use case discussion",
        playbook: "New Value",
        reason: "Explore adjacent problems your solution solves",
        expectedImpact: "medium",
        timeToExecute: "2 days",
        status: "pending",
      });
      break;

    case "SALES_PROCESS_GAPS":
      actions.push({
        id: crypto.randomUUID(),
        action: "Complete sales hygiene checklist",
        playbook: "Sales Hygiene",
        reason: "Document discovery summary and decision process before outreach",
        expectedImpact: "high",
        timeToExecute: "30 min",
        status: "pending",
      });
      break;
  }

  // Always add follow-up reminder
  actions.push({
    id: crypto.randomUUID(),
    action: "Set follow-up reminder",
    playbook: "Follow-up",
    reason: "Ensure consistent touchpoint to prevent deal from going cold",
    expectedImpact: "low",
    timeToExecute: "1 min",
    status: "pending",
  });

  return actions.slice(0, 3); // PRD: Only 1-3 actions shown
}
