import { Deal, Diagnosis, DiagnosisCode, RecommendedAction, Severity } from "@/types/deal";

// Rules-based diagnosis engine as specified in PRD
export function diagnoseDeal(deal: Deal): Diagnosis | null {
  const diagnoses: { code: DiagnosisCode; severity: Severity; evidence: string[] }[] = [];

  // Rule 1: Single-Threaded Deal
  if (deal.stakeholders.length <= 1) {
    diagnoses.push({
      code: "SINGLE_THREADED",
      severity: deal.daysInactive > 14 ? "critical" : "high",
      evidence: [
        `Only ${deal.stakeholders.length} contact associated with deal`,
        deal.daysInactive > 7 ? `Deal stalled for ${deal.daysInactive} days` : "",
      ].filter(Boolean),
    });
  }

  // Rule 2: No Economic Buyer
  const hasEconomicBuyer = deal.stakeholders.some(
    (s) =>
      s.role === "economic_buyer" ||
      /\b(cfo|ceo|vp|director|founder|head of|chief)\b/i.test(s.title)
  );
  if (!hasEconomicBuyer && deal.stakeholders.length > 0) {
    diagnoses.push({
      code: "NO_ECONOMIC_BUYER",
      severity: deal.stage === "negotiation" ? "critical" : "high",
      evidence: [
        "No stakeholder with budget authority identified",
        "Missing Finance / Founder / VP / Director titles",
      ],
    });
  }

  // Rule 3: No Clear Business Impact
  const impactKeywords = /\b(roi|revenue|cost|savings|efficiency|impact|metrics|%|million|thousand|\$)\b/i;
  if (!impactKeywords.test(deal.notes)) {
    diagnoses.push({
      code: "NO_BUSINESS_IMPACT",
      severity: "medium",
      evidence: [
        "No quantified metrics mentioned in notes",
        "Missing ROI, cost savings, or efficiency data",
      ],
    });
  }

  // Rule 4: No New Value (post-demo stagnation)
  if (
    (deal.stage === "demo" || deal.stage === "proposal") &&
    deal.daysInactive > 7
  ) {
    const recentValue = /\b(case study|example|insight|benchmark|new|update)\b/i;
    if (!recentValue.test(deal.notes)) {
      diagnoses.push({
        code: "NO_NEW_VALUE",
        severity: "medium",
        evidence: [
          "No new assets shared post-demo",
          "No fresh insights or customer examples provided",
        ],
      });
    }
  }

  // Rule 5: Weak Urgency
  const urgencyKeywords = /\b(deadline|urgent|asap|this quarter|this month|timeline|priority)\b/i;
  const delayKeywords = /\b(later|next year|revisit|someday|no rush|backburner)\b/i;
  if (delayKeywords.test(deal.notes) || !urgencyKeywords.test(deal.notes)) {
    diagnoses.push({
      code: "WEAK_URGENCY",
      severity: deal.daysInactive > 30 ? "high" : "medium",
      evidence: [
        "No clear timeline established",
        delayKeywords.test(deal.notes) ? "Buyer indicated low priority" : "No urgency keywords in notes",
      ],
    });
  }

  // Rule 6: Sales Process Gaps
  const processKeywords = /\b(discovery|use case|next step|meeting|call scheduled)\b/i;
  if (!processKeywords.test(deal.notes) && deal.stage !== "discovery") {
    diagnoses.push({
      code: "SALES_PROCESS_GAPS",
      severity: "medium",
      evidence: [
        "No discovery summary documented",
        "Missing next meeting or step confirmation",
      ],
    });
  }

  // Return highest severity diagnosis
  if (diagnoses.length === 0) return null;

  const severityOrder: Severity[] = ["critical", "high", "medium", "low"];
  diagnoses.sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  const primary = diagnoses[0];
  return {
    ...primary,
    explanation: generateExplanation(primary.code, deal),
  };
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

// Map diagnosis to recommended actions (playbooks from PRD)
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
