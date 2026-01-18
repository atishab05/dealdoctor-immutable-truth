import { Deal, DealSignals } from "@/types/deal";

/**
 * Computes normalized signals from deal data.
 * These signals are used by the rule engine for deterministic diagnosis.
 * Signals come from CRM fields + simple keyword detection (not LLM).
 */
export function computeSignals(deal: Deal): DealSignals {
  const notes = deal.notes.toLowerCase();

  // Contact count
  const contactCount = deal.stakeholders.length;

  // Decision maker present: EB / budget owner identified
  const decisionMakerPresent = deal.stakeholders.some(
    (s) =>
      s.role === "economic_buyer" ||
      /\b(cfo|ceo|vp|director|founder|head of|chief|owner|president)\b/i.test(s.title)
  );

  // Cross-functional contact present: Finance / Ops / IT
  const crossFunctionalContactPresent = deal.stakeholders.some((s) =>
    /\b(finance|operations|ops|it|legal|procurement|purchasing)\b/i.test(s.title)
  );

  // Days since last activity
  const daysSinceLastActivity = deal.daysInactive;

  // Days in stage (approximated from days inactive for now)
  const daysInStage = deal.daysInactive;

  // Next step scheduled
  const nextStepScheduled =
    /\b(scheduled|booked|confirmed|meeting on|call on|next step|follow.?up)\b/i.test(notes) ||
    deal.reminderDate !== null;

  // Budget discussed
  const budgetDiscussed =
    /\b(budget|pricing|cost|investment|spend|dollars|\$|contract value)\b/i.test(notes);

  // Metrics mentioned
  const metricsMentioned =
    /\b(roi|revenue|cost|savings|efficiency|impact|metrics|%|million|thousand|\$|kpi|benchmark)\b/i.test(notes);

  // New value sent post-demo
  const newValueSentPostDemo =
    (deal.stage === "demo" || deal.stage === "proposal" || deal.stage === "negotiation") &&
    /\b(case study|example|insight|benchmark|update|new|whitepaper|report|data)\b/i.test(notes);

  // Timeline defined
  const timelineDefined =
    /\b(deadline|timeline|by (q[1-4]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|this (quarter|month|week)|target date|go.?live)\b/i.test(notes);

  // Consequence of inaction defined
  const consequenceOfInactionDefined =
    /\b(risk|consequence|if we don't|cost of delay|miss|lose|fall behind|competitor)\b/i.test(notes);

  // Discovery summary present
  const discoverySummaryPresent =
    /\b(discovery|use case|pain point|challenge|problem|requirement|need)\b/i.test(notes);

  return {
    contactCount,
    decisionMakerPresent,
    crossFunctionalContactPresent,
    daysSinceLastActivity,
    daysInStage,
    nextStepScheduled,
    budgetDiscussed,
    metricsMentioned,
    newValueSentPostDemo,
    timelineDefined,
    consequenceOfInactionDefined,
    discoverySummaryPresent,
  };
}
