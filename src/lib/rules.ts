import { DealSignals, DiagnosisCode, RuleMatch, Severity } from "@/types/deal";

export interface DiagnosisRule {
  id: string;
  code: DiagnosisCode;
  condition: (signals: DealSignals) => boolean;
  severity: Severity;
}

// ============================================================
// DETERMINISTIC DIAGNOSIS RULES - DO NOT MODIFY
// These rules are from the PRD and must be implemented exactly.
// ============================================================

export const DIAGNOSIS_RULES: DiagnosisRule[] = [
  // ---- Sales Process Gaps (PG) ----
  {
    id: "PG-1",
    code: "SALES_PROCESS_GAPS",
    condition: (s) => !s.discoverySummaryPresent,
    severity: "medium",
  },
  {
    id: "PG-2",
    code: "SALES_PROCESS_GAPS",
    condition: (s) => !s.nextStepScheduled,
    severity: "high",
  },
  {
    id: "PG-3",
    code: "SALES_PROCESS_GAPS",
    condition: (s) => !s.discoverySummaryPresent && !s.nextStepScheduled,
    severity: "high",
  },

  // ---- Single-Threaded Deal (ST) ----
  {
    id: "ST-1",
    code: "SINGLE_THREADED",
    condition: (s) => s.contactCount === 1,
    severity: "medium",
  },
  {
    id: "ST-2",
    code: "SINGLE_THREADED",
    condition: (s) => s.contactCount === 1 && s.daysInStage > 14,
    severity: "high",
  },
  {
    id: "ST-3",
    code: "SINGLE_THREADED",
    condition: (s) => s.contactCount <= 2 && !s.crossFunctionalContactPresent,
    severity: "medium",
  },

  // ---- No Economic Buyer (EB) ----
  {
    id: "EB-1",
    code: "NO_ECONOMIC_BUYER",
    condition: (s) => !s.decisionMakerPresent,
    severity: "high",
  },
  {
    id: "EB-2",
    code: "NO_ECONOMIC_BUYER",
    condition: (s) => !s.decisionMakerPresent && s.daysInStage > 21,
    severity: "high",
  },
  {
    id: "EB-3",
    code: "NO_ECONOMIC_BUYER",
    condition: (s) => !s.budgetDiscussed && s.daysInStage > 14,
    severity: "medium",
  },

  // ---- No Clear Business Impact (BI) ----
  {
    id: "BI-1",
    code: "NO_BUSINESS_IMPACT",
    condition: (s) => !s.metricsMentioned,
    severity: "medium",
  },
  {
    id: "BI-2",
    code: "NO_BUSINESS_IMPACT",
    condition: (s) => !s.metricsMentioned && s.daysInStage > 21,
    severity: "high",
  },
  {
    id: "BI-3",
    code: "NO_BUSINESS_IMPACT",
    condition: (s) => !s.budgetDiscussed && !s.metricsMentioned,
    severity: "high",
  },

  // ---- Weak Urgency (UR) ----
  {
    id: "UR-1",
    code: "WEAK_URGENCY",
    condition: (s) => !s.timelineDefined,
    severity: "medium",
  },
  {
    id: "UR-2",
    code: "WEAK_URGENCY",
    condition: (s) => !s.timelineDefined && !s.consequenceOfInactionDefined,
    severity: "high",
  },
  {
    id: "UR-3",
    code: "WEAK_URGENCY",
    condition: (s) => s.daysInStage > 21 && !s.timelineDefined,
    severity: "high",
  },

  // ---- No New Value Introduced (NV) ----
  {
    id: "NV-1",
    code: "NO_NEW_VALUE",
    condition: (s) => !s.newValueSentPostDemo,
    severity: "medium",
  },
  {
    id: "NV-2",
    code: "NO_NEW_VALUE",
    condition: (s) => !s.newValueSentPostDemo && s.daysSinceLastActivity > 10,
    severity: "high",
  },
  {
    id: "NV-3",
    code: "NO_NEW_VALUE",
    condition: (s) => !s.newValueSentPostDemo && s.daysInStage > 14,
    severity: "high",
  },
];

// Execution order per PRD
export const DIAGNOSIS_EXECUTION_ORDER: DiagnosisCode[] = [
  "SALES_PROCESS_GAPS",   // 1. Hygiene issues distort all other signals
  "SINGLE_THREADED",      // 2. Structural blockers first
  "NO_ECONOMIC_BUYER",    // 3. Structural blockers
  "NO_BUSINESS_IMPACT",   // 4. 
  "WEAK_URGENCY",         // 5. 
  "NO_NEW_VALUE",         // 6. Messaging issues last
];

// Base confidence values per diagnosis type
export const BASE_CONFIDENCE: Record<DiagnosisCode, number> = {
  SINGLE_THREADED: 0.6,
  NO_ECONOMIC_BUYER: 0.7,
  NO_BUSINESS_IMPACT: 0.65,
  NO_NEW_VALUE: 0.6,
  WEAK_URGENCY: 0.65,
  SALES_PROCESS_GAPS: 0.7,
};

// Confidence bonuses for specific rules
export const CONFIDENCE_BONUSES: Record<string, number> = {
  "EB-2": 0.1,
  "NV-2": 0.15,
  "PG-3": 0.1,
};

// Evidence messages per rule
export const RULE_EVIDENCE: Record<string, string> = {
  "ST-1": "Only 1 contact associated",
  "ST-2": "Only 1 contact and deal stalled for 14+ days",
  "ST-3": "No cross-functional stakeholders identified",
  "EB-1": "No economic buyer identified",
  "EB-2": "No economic buyer and stalled for 21+ days",
  "EB-3": "Budget discussion missing",
  "BI-1": "No quantified impact found in notes",
  "BI-2": "No metrics discussed for 21+ days",
  "BI-3": "ROI or metrics not discussed",
  "NV-1": "No new insights shared post-demo",
  "NV-2": "No new value for 10+ days",
  "NV-3": "Repeated follow-ups without new content",
  "UR-1": "No decision timeline defined",
  "UR-2": "No consequence of delay discussed",
  "UR-3": "Stalled 21+ days without timeline",
  "PG-1": "No discovery summary recorded",
  "PG-2": "No next step scheduled",
  "PG-3": "Missing both discovery and next step",
};

/**
 * Evaluate all rules for a given set of signals.
 * Returns matched rules grouped by diagnosis code.
 */
export function evaluateRules(
  signals: DealSignals
): Map<DiagnosisCode, RuleMatch[]> {
  const results = new Map<DiagnosisCode, RuleMatch[]>();

  for (const rule of DIAGNOSIS_RULES) {
    if (rule.condition(signals)) {
      if (!results.has(rule.code)) {
        results.set(rule.code, []);
      }
      results.get(rule.code)!.push({
        ruleId: rule.id,
        severity: rule.severity,
      });
    }
  }

  return results;
}

/**
 * Calculate confidence for a diagnosis based on matched rules.
 */
export function calculateConfidence(
  code: DiagnosisCode,
  matchedRules: RuleMatch[]
): number {
  let confidence = BASE_CONFIDENCE[code];

  // Add rule count bonus (0.1 per matching rule after first)
  if (code === "SINGLE_THREADED" || code === "NO_BUSINESS_IMPACT") {
    confidence += 0.1 * (matchedRules.length - 1);
  }

  // Add specific rule bonuses
  for (const match of matchedRules) {
    if (CONFIDENCE_BONUSES[match.ruleId]) {
      confidence += CONFIDENCE_BONUSES[match.ruleId];
    }
  }

  return Math.min(confidence, 1.0);
}

/**
 * Get highest severity from matched rules.
 */
export function getHighestSeverity(matchedRules: RuleMatch[]): Severity {
  const severityOrder: Severity[] = ["high", "medium", "low"];
  
  for (const severity of severityOrder) {
    if (matchedRules.some((r) => r.severity === severity)) {
      return severity;
    }
  }
  
  return "medium";
}

/**
 * Collect evidence from matched rules.
 */
export function collectEvidence(matchedRules: RuleMatch[]): string[] {
  const evidence: string[] = [];
  const seen = new Set<string>();

  for (const match of matchedRules) {
    const msg = RULE_EVIDENCE[match.ruleId];
    if (msg && !seen.has(msg)) {
      evidence.push(msg);
      seen.add(msg);
    }
  }

  return evidence;
}
