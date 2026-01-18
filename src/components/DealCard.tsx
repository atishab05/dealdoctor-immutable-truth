import { Deal, DIAGNOSIS_LABELS, STAGE_LABELS, Severity } from "@/types/deal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Users, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
}

const severityStyles: Record<Severity, string> = {
  critical: "status-badge-critical",
  high: "status-badge-warning",
  medium: "status-badge-stalled",
  low: "status-badge-healthy",
};

export function DealCard({ deal, onClick }: DealCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card
      className="card-diagnostic border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group animate-slide-in-up"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {deal.companyName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {STAGE_LABELS[deal.stage]}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-medium text-foreground">
              {formatCurrency(deal.dealValue)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Metrics Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{deal.stakeholders.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{deal.daysInactive}d inactive</span>
          </div>
        </div>

        {/* Diagnosis Badge */}
        {deal.diagnosis ? (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                severityStyles[deal.diagnosis.severity]
              )}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              {DIAGNOSIS_LABELS[deal.diagnosis.code]}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs status-badge-stalled">
            Not diagnosed
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
