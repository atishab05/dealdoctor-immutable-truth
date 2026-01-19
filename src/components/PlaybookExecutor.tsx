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
  validateOutput,
} from "@/lib/playbooks";
import { supabase } from "@/integrations/supabase/client";
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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleExecute = async () => {
    if (!selectedPlaybook) return;

    setIsGenerating(true);
    setOutput("");
    setWarnings([]);

    try {
      // Build the prompt for the LLM
      const input = buildPlaybookInput(selectedPlaybook, deal, diagnosis, {
        tone,
        channel,
      });
      const userPrompt = buildPrompt(selectedPlaybook, input);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("execute-playbook", {
        body: {
          systemMessage: LLM_SYSTEM_MESSAGE,
          userPrompt,
          playbookId: selectedPlaybook,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error(error.message || "Failed to execute playbook");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const content = data?.content || "";
      setOutput(content);
      
      // Validate output against quality bars
      const outputWarnings = validateOutput(selectedPlaybook, content);
      setWarnings(outputWarnings);
      
      if (outputWarnings.length > 0) {
        toast.warning(`Generated with ${outputWarnings.length} warning(s)`);
      } else {
        toast.success("Playbook executed successfully");
      }
    } catch (err) {
      console.error("Error executing playbook:", err);
      toast.error("Failed to execute playbook");
    } finally {
      setIsGenerating(false);
    }
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

            {/* Validation Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-status-warning flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Quality Warnings Detected
                </p>
                <div className="space-y-1">
                  {warnings.map((warning, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 bg-status-warning/10 rounded border border-status-warning/20"
                    >
                      {warning}
                    </div>
                  ))}
                </div>
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

