import { useDealsStore } from "@/stores/deals-store";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";

export function DealsStats() {
  const { deals } = useDealsStore();

  const stats = {
    total: deals.length,
    critical: deals.filter((d) => d.diagnosis?.severity === "critical").length,
    stalled: deals.filter((d) => d.daysInactive > 14).length,
    healthy: deals.filter((d) => !d.diagnosis || d.diagnosis.severity === "low").length,
  };

  const totalValue = deals.reduce((sum, d) => sum + d.dealValue, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-diagnostic border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Active Deals</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            ${(totalValue / 1000).toFixed(0)}K pipeline
          </p>
        </CardContent>
      </Card>

      <Card className="card-diagnostic border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-critical/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-status-critical" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Critical Issues</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Needs immediate action</p>
        </CardContent>
      </Card>

      <Card className="card-diagnostic border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.stalled}</p>
              <p className="text-xs text-muted-foreground">Stalled Deals</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Inactive {">"} 14 days</p>
        </CardContent>
      </Card>

      <Card className="card-diagnostic border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-healthy/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-status-healthy" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.healthy}</p>
              <p className="text-xs text-muted-foreground">Healthy Deals</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">On track</p>
        </CardContent>
      </Card>
    </div>
  );
}
