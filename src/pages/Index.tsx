import { useState, useEffect } from "react";
import { useDealsStore } from "@/stores/deals-store";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DealsStats } from "@/components/DealsStats";
import { DealCard } from "@/components/DealCard";
import { DealDiagnosisPanel } from "@/components/DealDiagnosisPanel";
import { Deal } from "@/types/deal";
import { cn } from "@/lib/utils";

const Index = () => {
  const { deals, runDiagnosis } = useDealsStore();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Run diagnosis for all deals on mount
  useEffect(() => {
    deals.forEach((deal) => {
      if (!deal.diagnosis) {
        runDiagnosis(deal.id);
      }
    });
  }, []);

  // Keep selected deal in sync with store
  useEffect(() => {
    if (selectedDeal) {
      const updated = deals.find((d) => d.id === selectedDeal.id);
      if (updated) {
        setSelectedDeal(updated);
      }
    }
  }, [deals, selectedDeal?.id]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="flex">
        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            selectedDeal ? "pr-[480px]" : ""
          )}
        >
          <div className="container py-8 px-6 space-y-8">
            {/* Stats Overview */}
            <DealsStats />

            {/* Deals Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Your Deals</h2>
                <p className="text-sm text-muted-foreground">
                  {deals.length} deals in pipeline
                </p>
              </div>

              {deals.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground mb-2">No deals yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Add Deal" to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => setSelectedDeal(deal)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Side Panel */}
        {selectedDeal && (
          <aside className="fixed right-0 top-0 h-screen w-[480px] border-l border-border bg-card shadow-2xl animate-slide-in-up">
            <DealDiagnosisPanel
              deal={selectedDeal}
              onClose={() => setSelectedDeal(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default Index;
