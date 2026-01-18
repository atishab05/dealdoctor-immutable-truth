import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Deal, DealStage, Stakeholder } from "@/types/deal";
import { diagnoseDeal, generateActions } from "@/lib/diagnosis-engine";

interface DealsState {
  deals: Deal[];
  addDeal: (deal: Omit<Deal, "id" | "createdAt" | "diagnosis" | "recommendedActions">) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  runDiagnosis: (id: string) => void;
  updateActionStatus: (dealId: string, actionId: string, status: "pending" | "in_progress" | "completed") => void;
  setReminder: (dealId: string, date: Date | null) => void;
}

// Sample deals for demo
const sampleDeals: Deal[] = [
  {
    id: "1",
    companyName: "Acme Corp",
    dealValue: 75000,
    stage: "proposal",
    daysInactive: 18,
    stakeholders: [
      { id: "1", name: "Sarah Chen", title: "Product Manager", email: "sarah@acme.com", role: "champion" },
    ],
    notes: "Had a great demo. Sarah loved the integration features. Waiting for internal discussion.",
    diagnosis: null,
    recommendedActions: [],
    createdAt: new Date("2025-12-01"),
    lastActivityAt: new Date("2025-12-31"),
    reminderDate: null,
  },
  {
    id: "2",
    companyName: "TechStart Inc",
    dealValue: 120000,
    stage: "negotiation",
    daysInactive: 5,
    stakeholders: [
      { id: "2", name: "Mike Johnson", title: "CTO", email: "mike@techstart.io", role: "technical_buyer" },
      { id: "3", name: "Lisa Park", title: "CFO", email: "lisa@techstart.io", role: "economic_buyer" },
    ],
    notes: "ROI discussion went well. They're looking at 40% cost reduction. Timeline is end of Q1. Next step: security review.",
    diagnosis: null,
    recommendedActions: [],
    createdAt: new Date("2025-11-15"),
    lastActivityAt: new Date("2026-01-13"),
    reminderDate: null,
  },
  {
    id: "3",
    companyName: "GlobalRetail",
    dealValue: 250000,
    stage: "demo",
    daysInactive: 32,
    stakeholders: [
      { id: "4", name: "James Wilson", title: "IT Manager", email: "james@globalretail.com", role: "influencer" },
    ],
    notes: "Demo completed. They said they'll revisit next quarter. No budget discussion yet.",
    diagnosis: null,
    recommendedActions: [],
    createdAt: new Date("2025-10-20"),
    lastActivityAt: new Date("2025-12-17"),
    reminderDate: null,
  },
];

export const useDealsStore = create<DealsState>()(
  persist(
    (set, get) => ({
      deals: sampleDeals,

      addDeal: (dealData) => {
        const newDeal: Deal = {
          ...dealData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          diagnosis: null,
          recommendedActions: [],
        };

        // Auto-diagnose on creation
        const diagnosis = diagnoseDeal(newDeal);
        if (diagnosis) {
          newDeal.diagnosis = diagnosis;
          newDeal.recommendedActions = generateActions(diagnosis, newDeal);
        }

        set((state) => ({ deals: [...state.deals, newDeal] }));
        return newDeal;
      },

      updateDeal: (id, updates) => {
        set((state) => ({
          deals: state.deals.map((deal) =>
            deal.id === id ? { ...deal, ...updates } : deal
          ),
        }));
      },

      deleteDeal: (id) => {
        set((state) => ({
          deals: state.deals.filter((deal) => deal.id !== id),
        }));
      },

      runDiagnosis: (id) => {
        const deal = get().deals.find((d) => d.id === id);
        if (!deal) return;

        const diagnosis = diagnoseDeal(deal);
        const actions = diagnosis ? generateActions(diagnosis, deal) : [];

        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === id
              ? { ...d, diagnosis, recommendedActions: actions }
              : d
          ),
        }));
      },

      updateActionStatus: (dealId, actionId, status) => {
        set((state) => ({
          deals: state.deals.map((deal) =>
            deal.id === dealId
              ? {
                  ...deal,
                  recommendedActions: deal.recommendedActions.map((action) =>
                    action.id === actionId ? { ...action, status } : action
                  ),
                }
              : deal
          ),
        }));
      },

      setReminder: (dealId, date) => {
        set((state) => ({
          deals: state.deals.map((deal) =>
            deal.id === dealId ? { ...deal, reminderDate: date } : deal
          ),
        }));
      },
    }),
    {
      name: "deal-doctor-deals",
    }
  )
);
