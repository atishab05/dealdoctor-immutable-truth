import { Button } from "@/components/ui/button";
import { AddDealDialog } from "@/components/AddDealDialog";
import { Plus, Stethoscope } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Deal Doctor</h1>
            <p className="text-xs text-muted-foreground">AI-powered deal diagnosis</p>
          </div>
        </div>

        <AddDealDialog>
          <Button className="glow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </AddDealDialog>
      </div>
    </header>
  );
}
