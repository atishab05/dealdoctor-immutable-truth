import { Deal, DIAGNOSIS_LABELS, STAGE_LABELS, Severity } from "@/types/deal";
import { useDealsStore } from "@/stores/deals-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Calendar,
  ArrowRight,
  RefreshCw,
  Bell,
} from "lucide-react";
import { PlaybookExecutor } from "./PlaybookExecutor";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface DealDiagnosisPanelProps {
  deal: Deal;
  onClose: () => void;
}

const severityConfig: Record<Severity, { label: string; class: string; icon: React.ReactNode }> = {
  critical: { label: "Critical", class: "status-badge-critical", icon: <AlertTriangle className="w-4 h-4" /> },
  high: { label: "High Risk", class: "status-badge-warning", icon: <AlertTriangle className="w-4 h-4" /> },
  medium: { label: "Medium", class: "status-badge-stalled", icon: <Clock className="w-4 h-4" /> },
  low: { label: "Low", class: "status-badge-healthy", icon: <CheckCircle2 className="w-4 h-4" /> },
};

export function DealDiagnosisPanel({ deal, onClose }: DealDiagnosisPanelProps) {
  const { runDiagnosis, updateActionStatus, setReminder } = useDealsStore();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunDiagnosis = async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate processing
    runDiagnosis(deal.id);
    setIsRunning(false);
    toast.success("Diagnosis complete");
  };

  const handleActionClick = (actionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "pending";
    updateActionStatus(deal.id, actionId, nextStatus as any);
    if (nextStatus === "completed") {
      toast.success("Action marked complete");
    }
  };

  const handleSetReminder = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    setReminder(deal.id, tomorrow);
    toast.success("Reminder set for 3 days from now");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{deal.companyName}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span>{STAGE_LABELS[deal.stage]}</span>
              <span>•</span>
              <span className="font-mono">{formatCurrency(deal.dealValue)}</span>
              <span>•</span>
              <span>{deal.daysInactive}d inactive</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Diagnosis Section */}
        <Card className="card-diagnostic border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Deal Diagnosis
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunDiagnosis}
                disabled={isRunning}
                className="h-8"
              >
                <RefreshCw className={cn("w-4 h-4 mr-1.5", isRunning && "animate-spin")} />
                {isRunning ? "Analyzing..." : "Re-run"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.diagnosis ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn("font-medium", severityConfig[deal.diagnosis.severity].class)}
                  >
                    {severityConfig[deal.diagnosis.severity].icon}
                    <span className="ml-1">{severityConfig[deal.diagnosis.severity].label}</span>
                  </Badge>
                  <Badge variant="secondary" className="font-medium">
                    {DIAGNOSIS_LABELS[deal.diagnosis.code]}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    {Math.round(deal.diagnosis.confidence * 100)}% confidence
                  </Badge>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed">
                  {deal.diagnosis.explanation}
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Evidence
                  </p>
                  <ul className="space-y-1">
                    {deal.diagnosis.evidence.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {deal.diagnosis.matchedRules && deal.diagnosis.matchedRules.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Matched rules: <span className="font-mono">{deal.diagnosis.matchedRules.join(", ")}</span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Stethoscope className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No diagnosis run yet</p>
                <Button onClick={handleRunDiagnosis} disabled={isRunning}>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Diagnosis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Playbook Executor */}
        {deal.diagnosis && (
          <PlaybookExecutor deal={deal} diagnosis={deal.diagnosis} />
        )}

        {/* Recommended Actions */}
        {deal.recommendedActions.length > 0 && (
          <Card className="card-diagnostic border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.recommendedActions.map((action, index) => (
                <div
                  key={action.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    action.status === "completed"
                      ? "bg-status-healthy/5 border-status-healthy/20"
                      : action.status === "in_progress"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-secondary/50 border-border hover:border-primary/30"
                  )}
                  onClick={() => handleActionClick(action.id, action.status)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        action.status === "completed"
                          ? "bg-status-healthy text-background"
                          : action.status === "in_progress"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {action.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        action.status === "completed" && "line-through text-muted-foreground"
                      )}>
                        {action.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.reason}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {action.timeToExecute}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5",
                            action.expectedImpact === "high"
                              ? "status-badge-healthy"
                              : action.expectedImpact === "medium"
                              ? "status-badge-warning"
                              : "status-badge-stalled"
                          )}
                        >
                          {action.expectedImpact} impact
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reminder Section */}
        <Card className="card-diagnostic border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Follow-up Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.reminderDate ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Reminder set for {new Date(deal.reminderDate).toLocaleDateString()}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setReminder(deal.id, null)}>
                  Clear
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={handleSetReminder}>
                <Bell className="w-4 h-4 mr-2" />
                Set Follow-up Reminder
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stakeholders */}
        <Card className="card-diagnostic border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Stakeholders</CardTitle>
          </CardHeader>
          <CardContent>
            {deal.stakeholders.length > 0 ? (
              <div className="space-y-3">
                {deal.stakeholders.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.title}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {s.role.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No stakeholders added</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="card-diagnostic border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Deal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {deal.notes || "No notes available"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
