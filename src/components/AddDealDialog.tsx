import { useState } from "react";
import { useDealsStore } from "@/stores/deals-store";
import { DealStage, Stakeholder } from "@/types/deal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AddDealDialogProps {
  children: React.ReactNode;
}

const stages: { value: DealStage; label: string }[] = [
  { value: "discovery", label: "Discovery" },
  { value: "demo", label: "Demo" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
];

const roles: { value: Stakeholder["role"]; label: string }[] = [
  { value: "champion", label: "Champion" },
  { value: "economic_buyer", label: "Economic Buyer" },
  { value: "technical_buyer", label: "Technical Buyer" },
  { value: "influencer", label: "Influencer" },
  { value: "blocker", label: "Blocker" },
];

export function AddDealDialog({ children }: AddDealDialogProps) {
  const [open, setOpen] = useState(false);
  const { addDeal } = useDealsStore();

  const [companyName, setCompanyName] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [stage, setStage] = useState<DealStage>("discovery");
  const [daysInactive, setDaysInactive] = useState("0");
  const [notes, setNotes] = useState("");
  const [stakeholders, setStakeholders] = useState<Omit<Stakeholder, "id">[]>([]);

  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    title: "",
    email: "",
    role: "champion" as Stakeholder["role"],
  });

  const handleAddStakeholder = () => {
    if (!newStakeholder.name || !newStakeholder.title) {
      toast.error("Please fill in stakeholder name and title");
      return;
    }
    setStakeholders([...stakeholders, newStakeholder]);
    setNewStakeholder({ name: "", title: "", email: "", role: "champion" });
  };

  const handleRemoveStakeholder = (index: number) => {
    setStakeholders(stakeholders.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !dealValue) {
      toast.error("Please fill in company name and deal value");
      return;
    }

    const deal = addDeal({
      companyName,
      dealValue: parseFloat(dealValue),
      stage,
      daysInactive: parseInt(daysInactive) || 0,
      stakeholders: stakeholders.map((s) => ({ ...s, id: crypto.randomUUID() })),
      notes,
      lastActivityAt: new Date(),
      reminderDate: null,
    });

    toast.success(`${companyName} added and diagnosed`);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCompanyName("");
    setDealValue("");
    setStage("discovery");
    setDaysInactive("0");
    setNotes("");
    setStakeholders([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value ($) *</Label>
              <Input
                id="value"
                type="number"
                placeholder="50000"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Deal Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inactive">Days Inactive</Label>
              <Input
                id="inactive"
                type="number"
                placeholder="0"
                value={daysInactive}
                onChange={(e) => setDaysInactive(e.target.value)}
              />
            </div>
          </div>

          {/* Stakeholders */}
          <div className="space-y-3">
            <Label>Stakeholders</Label>
            
            {stakeholders.length > 0 && (
              <div className="space-y-2">
                {stakeholders.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.title} • {s.role.replace("_", " ")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStakeholder(i)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                value={newStakeholder.name}
                onChange={(e) =>
                  setNewStakeholder({ ...newStakeholder, name: e.target.value })
                }
              />
              <Input
                placeholder="Title"
                value={newStakeholder.title}
                onChange={(e) =>
                  setNewStakeholder({ ...newStakeholder, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email (optional)"
                value={newStakeholder.email}
                onChange={(e) =>
                  setNewStakeholder({ ...newStakeholder, email: e.target.value })
                }
              />
              <Select
                value={newStakeholder.role}
                onValueChange={(v) =>
                  setNewStakeholder({ ...newStakeholder, role: v as Stakeholder["role"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStakeholder}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Stakeholder
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Deal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter meeting notes, email summaries, pain points discussed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Include keywords like ROI, timeline, discovery, decision maker for better diagnosis
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Add & Diagnose
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
