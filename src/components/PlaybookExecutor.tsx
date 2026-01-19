import { useState } from "react";
import { Deal, Diagnosis, DIAGNOSIS_LABELS } from "@/types/deal";
import {
  PLAYBOOKS,
  PlaybookId,
  TonePreference,
  ChannelPreference,
  QUALITY_BARS,
  getPlaybookForDiagnosis,
  buildPlaybookInput,
  buildPrompt,
  LLM_SYSTEM_MESSAGE,
} from "@/lib/playbooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  Lightbulb,
  ClipboardCheck,
  Clock,
  Play,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlaybookExecutorProps {
  deal: Deal;
  diagnosis: Diagnosis;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Users: <Users className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Lightbulb: <Lightbulb className="w-4 h-4" />,
  ClipboardCheck: <ClipboardCheck className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
};

export function PlaybookExecutor({ deal, diagnosis }: PlaybookExecutorProps) {
  const recommendedPlaybookId = getPlaybookForDiagnosis(diagnosis.code);
  const [selectedPlaybook, setSelectedPlaybook] = useState<PlaybookId | null>(
    recommendedPlaybookId
  );
  const [tone, setTone] = useState<TonePreference>("direct");
  const [channel, setChannel] = useState<ChannelPreference>("email");
  const [output, setOutput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleExecute = async () => {
    if (!selectedPlaybook) return;

    setIsGenerating(true);
    setOutput("");

    // Build the prompt (this is what would go to the LLM)
    const input = buildPlaybookInput(selectedPlaybook, deal, diagnosis, {
      tone,
      channel,
    });
    const prompt = buildPrompt(selectedPlaybook, input);

    // Simulate LLM response for demo (in production, this calls the LLM API)
    await new Promise((r) => setTimeout(r, 1500));

    // Generate mock output based on playbook
    const mockOutput = generateMockOutput(selectedPlaybook, deal, diagnosis, tone, channel);
    setOutput(mockOutput);
    setIsGenerating(false);
    toast.success("Playbook executed");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const playbook = selectedPlaybook ? PLAYBOOKS[selectedPlaybook] : null;
  const qualityBar = selectedPlaybook ? QUALITY_BARS[selectedPlaybook] : null;

  return (
    <Card className="card-diagnostic border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Execute Playbook
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          LLM assists execution only — does not change diagnosis or strategy
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playbook Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Select Playbook
          </label>
          <div className="grid gap-2">
            {Object.values(PLAYBOOKS).map((pb) => {
              const isRecommended = pb.id === recommendedPlaybookId;
              const isSelected = pb.id === selectedPlaybook;

              return (
                <button
                  key={pb.id}
                  onClick={() => setSelectedPlaybook(pb.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border",
                    !pb.mappedDiagnoses.includes(diagnosis.code) &&
                      "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {ICON_MAP[pb.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pb.name}</span>
                      {isRecommended && (
                        <Badge variant="secondary" className="text-[10px]">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {pb.objective}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferences */}
        {playbook && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tone
              </label>
              <Select value={tone} onValueChange={(v) => setTone(v as TonePreference)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="supportive">Supportive</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Channel
              </label>
              <Select value={channel} onValueChange={(v) => setChannel(v as ChannelPreference)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call Script</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Quality Bar */}
        {qualityBar && (
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Output Quality Bar
            </p>
            <div className="flex flex-wrap gap-2">
              {qualityBar.good.map((item) => (
                <Badge key={item} variant="outline" className="text-[10px] status-badge-healthy">
                  ✓ {item}
                </Badge>
              ))}
              {qualityBar.bad.map((item) => (
                <Badge key={item} variant="outline" className="text-[10px] status-badge-critical">
                  ✗ {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Execute Button */}
        {playbook && (
          <Button
            className="w-full"
            onClick={handleExecute}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute {playbook.name}
              </>
            )}
          </Button>
        )}

        {/* Output */}
        {output && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Generated Output
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  {isEditing ? "Done" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {isEditing ? (
              <Textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            ) : (
              <div className="p-4 bg-secondary/30 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {output}
                </pre>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-status-warning/10 rounded-lg border border-status-warning/20">
              <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Always review before sending. LLM output is assistive only — 
                you own the final message.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Mock output generator for demo purposes.
 * In production, this would be replaced by actual LLM API call.
 */
function generateMockOutput(
  playbookId: PlaybookId,
  deal: Deal,
  diagnosis: Diagnosis,
  tone: TonePreference,
  channel: ChannelPreference
): string {
  const stakeholder = deal.stakeholders[0];
  const stakeholderName = stakeholder?.name || "[Contact Name]";

  const outputs: Record<PlaybookId, string> = {
    multi_thread: `WARM INTRO REQUEST
---
Hi ${stakeholderName},

${tone === "executive" ? "I wanted to" : tone === "direct" ? "Quick ask:" : "Hope you're doing well."} ${tone === "direct" ? "c" : "C"}onnect with someone on your team who handles [specific area based on their role].

Given our conversation about ${deal.notes?.slice(0, 50) || "your initiative"}..., I think it would be valuable to include their perspective early.

Would you be open to making an introduction?

---
COLD OUTREACH (if target identified)
---
Subject: ${deal.companyName} - [Specific Area] perspective

Hi [New Contact Name],

${stakeholderName} and I have been discussing [initiative]. Given your role in [their department], your input would be valuable.

Would you have 15 minutes this week?`,

    business_impact: `COST OF INACTION FRAMING
---
Consider what happens if this initiative doesn't move forward:

• The challenge you described around [reference from notes] continues
• Your team keeps spending time on [current manual process]
• The gap between where you are and where you want to be widens

---
CLARIFYING QUESTIONS
---
1. How is [the current challenge] affecting your team's day-to-day?
2. What happens to your [specific goal] if this isn't addressed this quarter?`,

    introduce_new_value: `NEW VALUE ANGLE
---
Since our last conversation, I've been thinking about ${deal.companyName}'s situation...

Rather than rehash what we covered in the demo, I wanted to share a different angle:

[One specific insight relevant to their industry/situation]

---
DRAFT MESSAGE
---
Subject: A different angle for ${deal.companyName}

Hi ${stakeholderName},

I came across something that made me think of our conversation. 

[Share the new insight/perspective — not a feature, but a way of thinking about their problem]

Thought it might be useful as you evaluate next steps.

Happy to discuss if helpful.`,

    sales_hygiene: `INTERNAL CHECKLIST (not for buyer)
---
Before re-engaging ${deal.companyName}:

[ ] Review discovery notes — do I have documented answers to:
    - Business problem/pain?
    - Impact of not solving?
    - Decision timeline?
    - Budget holder identified?

[ ] Confirm next steps are clear:
    - What did we agree to do next?
    - Who is responsible for what?
    - When was this supposed to happen?

[ ] Check stakeholder coverage:
    - Economic buyer engaged? ${deal.stakeholders.some(s => s.role === "economic_buyer") ? "✓ Yes" : "✗ No"}
    - Champion identified? ${deal.stakeholders.some(s => s.role === "champion") ? "✓ Yes" : "✗ No"}
    - Any blockers known? ${deal.stakeholders.some(s => s.role === "blocker") ? "⚠ Yes" : "Unknown"}

[ ] Prepare value summary before outreach
[ ] Have a specific reason for reaching out (not "checking in")`,

    create_urgency: `TIMELINE CLARIFICATION MESSAGE
---
Hi ${stakeholderName},

I wanted to follow up on our conversation about ${deal.notes?.slice(0, 30) || "your initiative"}...

To make sure I'm aligned with your timeline: are you looking to have a solution in place by a specific date, or is this more exploratory at this stage?

---
CLOSE-ENDED QUESTION
---
"Are you targeting Q1 or Q2 for implementation?"

(Adjust based on current quarter — gives them two options without pressure)`,
  };

  return outputs[playbookId] || "Playbook output will appear here.";
}
