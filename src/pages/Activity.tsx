import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Car, Train, Bike, Footprints, Check, X, ChevronLeft, ChevronRight, Utensils, Bolt, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCarbonAnalysisHistory, getLatestCarbonAnalysis } from "@/lib/carbon/storage";
import type { CarbonActivity } from "@/lib/carbon/inference";
import { useNavigate } from "react-router-dom";

type Category = "transport" | "food" | "energy" | "goods";

type Confidence = "high" | "medium" | "low";

interface ActivityEntry {
  id: string;
  category: Category;
  mode?: string;
  icon: typeof Car;
  label: string;
  distance?: number;
  amount?: number;
  co2: number;
  confidence: Confidence;
  confidenceReason: string;
  time: string;
  confirmed: boolean;
  sourceTag?: string;
}

const modeIcons: Record<string, typeof Car> = { car: Car, train: Train, bike: Bike, walk: Footprints };
const emissionFactors: Record<string, number> = { car: 0.21, train: 0.041, bike: 0, walk: 0 };
const categoryIcons: Record<Category, typeof Car> = {
  transport: Car,
  food: Utensils,
  energy: Bolt,
  goods: ShoppingBag,
};

const initialEntriesByDay: Record<number, ActivityEntry[]> = {
  "0": [
    {
      id: "1",
      category: "transport",
      mode: "car",
      icon: Car,
      label: "Morning commute",
      distance: 12.4,
      co2: 2.6,
      confidence: "high",
      confidenceReason: "GPS tracked + user confirmed",
      time: "8:15 AM",
      confirmed: true,
    },
    {
      id: "2",
      category: "transport",
      mode: "train",
      icon: Train,
      label: "Noon station ride",
      distance: 8,
      co2: 0.33,
      confidence: "medium",
      confidenceReason: "GPS only — mode inferred from speed",
      time: "12:30 PM",
      confirmed: false,
    },
    {
      id: "3",
      category: "food",
      icon: Utensils,
      label: "Packaged snack purchase",
      amount: 1,
      co2: 0.6,
      confidence: "low",
      confidenceReason: "Receipt OCR estimated item impact",
      time: "3:45 PM",
      confirmed: false,
    },
    {
      id: "4",
      category: "energy",
      icon: Bolt,
      label: "Peak AC usage",
      amount: 4,
      co2: 0.47,
      confidence: "medium",
      confidenceReason: "Smart meter spike inferred",
      time: "6:10 PM",
      confirmed: false,
    },
  ],
  "-1": [
    {
      id: "y1",
      category: "transport",
      mode: "bike",
      icon: Bike,
      label: "Cycling to office",
      distance: 7,
      co2: 0,
      confidence: "high",
      confidenceReason: "Manually logged and confirmed",
      time: "9:05 AM",
      confirmed: true,
    },
    {
      id: "y2",
      category: "food",
      icon: Utensils,
      label: "Vegetarian lunch",
      amount: 1,
      co2: 0.28,
      confidence: "high",
      confidenceReason: "Receipt + user correction",
      time: "1:12 PM",
      confirmed: true,
    },
  ],
  "1": [],
};

const categoryTabs: Category[] = ["transport", "food", "energy", "goods"];

const categoryLabelMap: Record<Category, string> = {
  transport: "transport",
  food: "food",
  energy: "energy",
  goods: "goods",
};

const modeFromFactor = (factorKey: string) => {
  if (factorKey.includes("train") || factorKey.includes("metro") || factorKey.includes("bus")) return "train";
  if (factorKey.includes("bike") || factorKey.includes("motorbike") || factorKey.includes("scooter")) return "bike";
  if (factorKey.includes("walk")) return "walk";
  return "car";
};

const analysisToEntry = (item: CarbonActivity, createdAt: string, index: number): ActivityEntry => {
  const category = item.category;
  return {
    id: `ml-${createdAt}-${item.factorKey}-${index}`,
    category,
    mode: category === "transport" ? modeFromFactor(item.factorKey) : undefined,
    icon: categoryIcons[category],
    label: item.label,
    distance: item.unit.includes("km") ? item.quantity : undefined,
    amount: item.unit.includes("km") ? undefined : item.quantity,
    co2: parseFloat(item.co2Kg.toFixed(2)),
    confidence: item.confidence,
    confidenceReason: item.confidenceReason,
    time: new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    confirmed: item.confidence === "high",
    sourceTag: "Carbon Lens",
  };
};

const Activity = () => {
  const [entriesByDay, setEntriesByDay] = useState<Record<number, ActivityEntry[]>>(initialEntriesByDay);
  const [modelEntries, setModelEntries] = useState<ActivityEntry[]>([]);
  const [runDelta, setRunDelta] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category>("transport");
  const [explainEntry, setExplainEntry] = useState<ActivityEntry | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [newMode, setNewMode] = useState("car");
  const [newDistance, setNewDistance] = useState("");
  const [manualCategory, setManualCategory] = useState<Category>("food");
  const [manualDescription, setManualDescription] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const syncFromAnalysis = () => {
      const latest = getLatestCarbonAnalysis();
      const history = getCarbonAnalysisHistory();

      if (history.length >= 2) {
        setRunDelta(parseFloat((history[0].totalKgCo2e - history[1].totalKgCo2e).toFixed(2)));
      } else {
        setRunDelta(null);
      }

      if (!latest || latest.activities.length === 0) {
        setModelEntries([]);
        return;
      }

      setModelEntries(latest.activities.map((item, index) => analysisToEntry(item, latest.createdAt, index)));
    };

    syncFromAnalysis();
    window.addEventListener("eco-carbon-analysis-update", syncFromAnalysis);
    return () => {
      window.removeEventListener("eco-carbon-analysis-update", syncFromAnalysis);
    };
  }, []);

  const currentEntries = dayOffset === 0 ? [...modelEntries, ...(entriesByDay[dayOffset] ?? [])] : (entriesByDay[dayOffset] ?? []);
  const filteredEntries = currentEntries.filter((item) => item.category === activeCategory);

  const todayCo2 = currentEntries.reduce((sum, item) => sum + item.co2, 0);
  const pendingCount = currentEntries.filter((item) => item.confidence !== "high" && !item.confirmed).length;

  const dayLabel = dayOffset === 0 ? "Today" : dayOffset < 0 ? "Yesterday" : "Tomorrow";

  const updateCurrentEntries = (updater: (prev: ActivityEntry[]) => ActivityEntry[]) => {
    setEntriesByDay((prev) => ({
      ...prev,
      [dayOffset]: updater(prev[dayOffset] ?? []),
    }));
  };

  const confirmEntry = (id: string) => {
    updateCurrentEntries((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              confirmed: true,
              confidence: "high",
              confidenceReason: "User confirmed this activity",
            }
          : item,
      ),
    );

    toast({ title: "Entry confirmed", description: "Confidence upgraded to High." });
  };

  const dismissEntry = (id: string) => {
    updateCurrentEntries((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Entry dismissed", description: "This activity has been removed." });
  };

  const addTrip = () => {
    const dist = parseFloat(newDistance);
    if (Number.isNaN(dist) || dist <= 0) {
      toast({ title: "Invalid distance", description: "Enter a valid positive distance." });
      return;
    }

    const co2 = dist * emissionFactors[newMode];
    const trip: ActivityEntry = {
      id: Date.now().toString(),
      category: "transport",
      mode: newMode,
      icon: modeIcons[newMode],
      label: `Manual ${newMode} trip`,
      distance: dist,
      co2: parseFloat(co2.toFixed(2)),
      confidence: "high",
      confidenceReason: "Manually entered by user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confirmed: true,
    };

    updateCurrentEntries((prev) => [trip, ...prev]);
    setShowTripForm(false);
    setNewDistance("");
    setActiveCategory("transport");
    toast({ title: "Trip logged", description: "Transport activity added successfully." });
  };

  const addManualLog = () => {
    const amountValue = parseFloat(manualAmount);
    if (!manualDescription.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      toast({ title: "Missing details", description: "Add category, description and valid amount." });
      return;
    }

    const roughFactor: Record<Category, number> = {
      transport: 0.2,
      food: 0.6,
      energy: 0.12,
      goods: 0.35,
    };

    const entry: ActivityEntry = {
      id: `${Date.now()}-manual`,
      category: manualCategory,
      icon: categoryIcons[manualCategory],
      label: manualDescription.trim(),
      amount: amountValue,
      co2: parseFloat((amountValue * roughFactor[manualCategory]).toFixed(2)),
      confidence: "high",
      confidenceReason: "Manually entered by user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confirmed: true,
    };

    updateCurrentEntries((prev) => [entry, ...prev]);
    setShowManualForm(false);
    setManualDescription("");
    setManualAmount("");
    setActiveCategory(manualCategory);
    toast({ title: "Manual log added", description: `${manualCategory} activity saved.` });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4 lg:max-w-5xl lg:mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Good Choices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track daily actions and confirm your mobility footprint</p>
          <button
            type="button"
            onClick={() => navigate("/carbon-lens")}
            className="mt-2 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-foreground"
          >
            Open Carbon Lens
          </button>
        </div>

        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-primary text-xs font-medium uppercase tracking-wider">{dayLabel}</p>
          <p className="text-foreground text-3xl font-bold mt-1">{todayCo2.toFixed(1)} kg CO₂</p>
          <p className="text-muted-foreground text-xs mt-1">
            {currentEntries.length} choices · {pendingCount} pending confirmation
          </p>
          {runDelta !== null && (
            <p className={`text-xs mt-2 ${runDelta <= 0 ? "text-primary" : "text-foreground"}`}>
              Carbon Lens vs previous run: {runDelta > 0 ? `+${runDelta}` : runDelta} kg
            </p>
          )}
        </div>

        <div className="rounded-xl bg-card border border-border p-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDayOffset((value) => value - 1)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" /> Yesterday
          </button>
          <span className="text-sm font-semibold text-foreground">{dayLabel}</span>
          <button
            type="button"
            onClick={() => setDayOffset((value) => value + 1)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Tomorrow <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-card border border-border p-2 grid grid-cols-4 gap-2">
          {categoryTabs.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition-colors ${
                activeCategory === category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {showTripForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl bg-card p-4 shadow-card space-y-3 border border-border"
          >
            <p className="text-sm font-semibold text-foreground">Log a transport trip</p>
            <div className="flex gap-2">
              {Object.entries(modeIcons).map(([mode, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setNewMode(mode)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-lg p-2.5 text-xs font-medium transition-colors ${
                    newMode === mode ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {mode}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Distance (km)"
              value={newDistance}
              onChange={(event) => setNewDistance(event.target.value)}
              className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <Button onClick={addTrip} size="sm" className="flex-1">Add Trip</Button>
              <Button onClick={() => setShowTripForm(false)} size="sm" variant="ghost">Cancel</Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeCategory === "transport") {
                  setShowTripForm(true);
                  return;
                }

                setManualCategory(activeCategory);
                setShowManualForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4" /> Log {categoryLabelMap[activeCategory]}
            </button>
            <button
              type="button"
              onClick={() => setShowManualForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4" /> Log manually
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{dayLabel}&apos;s choices · {activeCategory}</p>
          {filteredEntries.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-6 text-sm text-muted-foreground">
              No {activeCategory} activity recorded for {dayLabel.toLowerCase()}.
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const Icon = entry.icon;
              const showActions = entry.confidence !== "high" && !entry.confirmed;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="rounded-xl bg-card p-4 shadow-card border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-transport/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-transport" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{entry.label}</span>
                        {entry.sourceTag && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{entry.sourceTag}</span>
                        )}
                        <ConfidenceBadge
                          level={entry.confidence}
                          reason={entry.confidenceReason}
                          onClick={() => setExplainEntry(entry)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.distance ? `${entry.distance} km` : `${entry.amount ?? 1} units`} · {entry.time}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{entry.co2} kg</p>
                      <p className="text-[10px] text-muted-foreground">CO₂</p>
                    </div>
                  </div>

                  {showActions && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => confirmEntry(entry.id)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => dismissEntry(entry.id)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <Sheet open={!!explainEntry} onOpenChange={() => setExplainEntry(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>How we calculated this</SheetTitle>
            <SheetDescription>Breakdown of the emission estimate</SheetDescription>
          </SheetHeader>
          {explainEntry && (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground capitalize">{explainEntry.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">{explainEntry.distance ? `${explainEntry.distance} km` : `${explainEntry.amount ?? 1} units`}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Total CO₂</span>
                  <span className="text-primary">{explainEntry.co2} kg</span>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Confidence: {explainEntry.confidence}</p>
                <p className="text-xs text-muted-foreground">{explainEntry.confidenceReason}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log activity manually</DialogTitle>
            <DialogDescription>Add food, energy, or goods activity with an estimated amount.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={manualCategory}
              onChange={(event) => setManualCategory(event.target.value as Category)}
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="food">Food</option>
              <option value="energy">Energy</option>
              <option value="goods">Goods</option>
              <option value="transport">Transport</option>
            </select>
            <input
              value={manualDescription}
              onChange={(event) => setManualDescription(event.target.value)}
              placeholder="Description"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <input
              value={manualAmount}
              onChange={(event) => setManualAmount(event.target.value)}
              type="number"
              min="0"
              step="0.1"
              placeholder="Amount"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <Button className="w-full" onClick={addManualLog}>Save Manual Log</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Activity;
