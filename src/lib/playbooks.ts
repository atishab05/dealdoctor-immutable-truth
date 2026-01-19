import { DiagnosisCode, Diagnosis, Deal } from "@/types/deal";

/**
 * LLM-Safe Playbook Templates
 * 
 * NON-NEGOTIABLE RULE: The LLM does NOT decide what to do.
 * It ONLY helps execute a pre-approved playbook.
 * Every prompt is playbook-scoped.
 */

export type PlaybookId = 
  | "multi_thread"
  | "business_impact"
  | "introduce_new_value"
  | "sales_hygiene"
  | "create_urgency";

export type TonePreference = "direct" | "supportive" | "executive";
export type ChannelPreference = "email" | "call" | "linkedin";

export interface Playbook {
  id: PlaybookId;
  name: string;
  objective: string;
  allowedActions: string[];
  mappedDiagnoses: DiagnosisCode[];
  icon: string;
}

export interface PlaybookInput {
  playbook: {
    name: string;
    objective: string;
    allowedActions: string[];
  };
  diagnosis: {
    code: DiagnosisCode;
    severity: string;
    evidence: string[];
  };
  dealContext: {
    companyName: string;
    stage: string;
    dealValue: number;
    stakeholders: Array<{
      name: string;
      title: string;
      role: string;
    }>;
    notes: string;
    daysInactive: number;
  };
  sellerPreferences: {
    tone: TonePreference;
    channel: ChannelPreference;
  };
}

export interface PlaybookOutput {
  playbook: PlaybookId;
  outputType: "draft" | "checklist" | "questions";
  content: string;
  warnings: string[];
  isEditable: boolean;
}

/**
 * System message - static, reused across all playbooks
 */
export const LLM_SYSTEM_MESSAGE = `You are a B2B sales execution assistant.

You do NOT diagnose deals or change strategy.

You ONLY help execute the given playbook using the provided context.

You must:
- Stay consistent with the diagnosis and evidence
- Avoid generic advice
- Produce concise, professional output
- Never invent facts, metrics, or stakeholders

HARD BANS:
- No invented metrics
- No invented stakeholders
- No changing diagnosis
- No claiming deal risk level

SOFT CONTROLS:
- Limit to ONE core message per draft
- Short paragraphs
- Buyer-centric framing`;

/**
 * Playbook definitions - immutable
 */
export const PLAYBOOKS: Record<PlaybookId, Playbook> = {
  multi_thread: {
    id: "multi_thread",
    name: "Multi-Thread the Deal",
    objective: "Expand stakeholder coverage and reduce single-point-of-failure risk",
    allowedActions: [
      "draft outreach to additional stakeholder",
      "warm-intro request"
    ],
    mappedDiagnoses: ["SINGLE_THREADED", "NO_ECONOMIC_BUYER"],
    icon: "Users",
  },
  business_impact: {
    id: "business_impact",
    name: "Re-Anchor on Business Impact",
    objective: "Quantify value and cost of inaction",
    allowedActions: [
      "frame cost of inaction",
      "clarifying questions for impact"
    ],
    mappedDiagnoses: ["NO_BUSINESS_IMPACT"],
    icon: "TrendingUp",
  },
  introduce_new_value: {
    id: "introduce_new_value",
    name: "Introduce New Value",
    objective: "Re-engage buyer with fresh insight",
    allowedActions: [
      "new perspective angle",
      "customer proof point",
      "adjacent use case"
    ],
    mappedDiagnoses: ["NO_NEW_VALUE"],
    icon: "Lightbulb",
  },
  sales_hygiene: {
    id: "sales_hygiene",
    name: "Sales Hygiene Fix",
    objective: "Repair foundational sales process gaps",
    allowedActions: [
      "internal checklist",
      "pre-call preparation"
    ],
    mappedDiagnoses: ["SALES_PROCESS_GAPS"],
    icon: "ClipboardCheck",
  },
  create_urgency: {
    id: "create_urgency",
    name: "Create Urgency",
    objective: "Surface timeline and priority without pressure",
    allowedActions: [
      "timeline clarification",
      "close-ended question"
    ],
    mappedDiagnoses: ["WEAK_URGENCY"],
    icon: "Clock",
  },
};

/**
 * User prompt templates - one per playbook
 * {{evidence}} and {{dealContext}} are replaced at runtime
 */
export const PLAYBOOK_PROMPTS: Record<PlaybookId, string> = {
  multi_thread: `The deal is single-threaded.

Diagnosis evidence:
{{evidence}}

Deal context:
{{dealContext}}

Your task:
- Draft outreach to ONE additional stakeholder
- Suggest a warm-intro request to the existing contact
- Do NOT invent job titles or names
- Keep tone aligned with seller preference: {{tone}}
- Channel: {{channel}}

Avoid:
- Pressure tactics
- Claims of urgency unless stated

Output format:
1. Warm intro request (to existing contact)
2. Cold outreach draft (if target identified)`,

  business_impact: `The deal lacks quantified business impact.

Diagnosis evidence:
{{evidence}}

Deal context:
{{dealContext}}

Your task:
- Frame the cost of inaction without using numbers
- Ask 1-2 clarifying questions to confirm impact
- Avoid inventing ROI or benchmarks
- Keep language neutral and consultative
- Tone: {{tone}}
- Channel: {{channel}}

Output format:
1. Cost of inaction framing
2. Clarifying questions (max 2)`,

  introduce_new_value: `The deal is stalled after demo or proposal.

Diagnosis evidence:
{{evidence}}

Deal context:
{{dealContext}}

Your task:
- Introduce ONE new perspective or angle
- Avoid restating features already discussed
- Position as helpful insight, not a follow-up ping
- Tone: {{tone}}
- Channel: {{channel}}

Output format:
1. New value angle
2. Draft message`,

  sales_hygiene: `The deal shows sales process gaps.

Diagnosis evidence:
{{evidence}}

Deal context:
{{dealContext}}

Your task:
- Generate an INTERNAL checklist for the seller
- Do NOT draft buyer-facing messages
- Focus on preparation before re-engaging

Output format:
INTERNAL CHECKLIST (not for buyer):
[ ] Item 1
[ ] Item 2
...`,

  create_urgency: `The deal lacks urgency or a clear timeline.

Diagnosis evidence:
{{evidence}}

Deal context:
{{dealContext}}

Your task:
- Draft a message that asks for timeline clarity
- Use a close-ended question
- Avoid artificial deadlines or pressure
- Tone: {{tone}}
- Channel: {{channel}}

Output format:
1. Timeline clarification message
2. Close-ended question`,
};

/**
 * Quality bars per playbook - used for validation
 */
export const QUALITY_BARS: Record<PlaybookId, { good: string[]; bad: string[] }> = {
  multi_thread: {
    good: ["Contextual", "Polite", "Non-assumptive"],
    bad: ["'Looping you in' spam"],
  },
  business_impact: {
    good: ["Buyer-centric", "Question-led"],
    bad: ["Fake numbers", "'Industry average' claims"],
  },
  introduce_new_value: {
    good: ["Fresh", "Insightful"],
    bad: ["'Just checking in'", "Feature dump"],
  },
  sales_hygiene: {
    good: ["Internal-only", "Clear steps"],
    bad: ["Buyer emails", "Strategy commentary"],
  },
  create_urgency: {
    good: ["Respectful", "Clear ask"],
    bad: ["Fake deadlines", "Ultimatums"],
  },
};

/**
 * Map diagnosis to recommended playbook
 */
export function getPlaybookForDiagnosis(diagnosisCode: DiagnosisCode): PlaybookId | null {
  for (const [id, playbook] of Object.entries(PLAYBOOKS)) {
    if (playbook.mappedDiagnoses.includes(diagnosisCode)) {
      return id as PlaybookId;
    }
  }
  return null;
}

/**
 * Build the complete input schema for an LLM call
 */
export function buildPlaybookInput(
  playbookId: PlaybookId,
  deal: Deal,
  diagnosis: Diagnosis,
  preferences: { tone: TonePreference; channel: ChannelPreference }
): PlaybookInput {
  const playbook = PLAYBOOKS[playbookId];
  
  return {
    playbook: {
      name: playbook.name,
      objective: playbook.objective,
      allowedActions: playbook.allowedActions,
    },
    diagnosis: {
      code: diagnosis.code,
      severity: diagnosis.severity,
      evidence: diagnosis.evidence,
    },
    dealContext: {
      companyName: deal.companyName,
      stage: deal.stage,
      dealValue: deal.dealValue,
      stakeholders: deal.stakeholders.map(s => ({
        name: s.name,
        title: s.title,
        role: s.role,
      })),
      notes: deal.notes,
      daysInactive: deal.daysInactive,
    },
    sellerPreferences: preferences,
  };
}

/**
 * Build the complete prompt for an LLM call
 */
export function buildPrompt(
  playbookId: PlaybookId,
  input: PlaybookInput
): string {
  let prompt = PLAYBOOK_PROMPTS[playbookId];
  
  // Replace evidence
  const evidenceStr = input.diagnosis.evidence.map(e => `- ${e}`).join("\n");
  prompt = prompt.replace("{{evidence}}", evidenceStr);
  
  // Replace deal context
  const contextStr = `Company: ${input.dealContext.companyName}
Stage: ${input.dealContext.stage}
Value: $${input.dealContext.dealValue.toLocaleString()}
Days Inactive: ${input.dealContext.daysInactive}
Stakeholders: ${input.dealContext.stakeholders.map(s => `${s.name} (${s.title}, ${s.role})`).join("; ") || "None listed"}
Notes: ${input.dealContext.notes || "None"}`;
  prompt = prompt.replace("{{dealContext}}", contextStr);
  
  // Replace preferences
  prompt = prompt.replace("{{tone}}", input.sellerPreferences.tone);
  prompt = prompt.replace("{{channel}}", input.sellerPreferences.channel);
  
  return prompt;
}

/**
 * Validate output against quality bars
 * Returns warnings for bad patterns detected
 */
export function validateOutput(
  playbookId: PlaybookId,
  output: string
): string[] {
  const warnings: string[] = [];
  const lowercaseOutput = output.toLowerCase();
  
  // Check for common bad patterns
  const badPatterns: Record<string, string> = {
    "looping you in": "Avoid 'looping you in' spam",
    "industry average": "Remove 'industry average' claims - no invented benchmarks",
    "just checking in": "Replace 'just checking in' with value-adding content",
    "as promised": "Avoid assumptive language",
    "circle back": "Avoid generic follow-up language",
  };
  
  for (const [pattern, warning] of Object.entries(badPatterns)) {
    if (lowercaseOutput.includes(pattern)) {
      warnings.push(warning);
    }
  }
  
  // Check for invented numbers (suspicious percentages)
  const numberPattern = /\d{2,}%|\$\d{1,3}(,\d{3})*[KMB]?/g;
  if (playbookId === "business_impact" && numberPattern.test(output)) {
    warnings.push("Possible invented metrics detected - review numbers carefully");
  }
  
  return warnings;
}
