import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check, Leaf, Mic, Zap } from "lucide-react";
import Header from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getUserName } from "@/lib/userStorage";

type Period = "day" | "week" | "month";

interface CategoryData {
  label: string;
  value: number;
  colorClass: string;
}

interface InsightData {
  title: string;
  value: string;
  unit: string;
  helper: string;
  icon: typeof Check;
  progress: string;
  detail: string;
}

const periodData: Record<Period, { total: number; score: number; categories: CategoryData[] }> = {
  day: {
    total: 12.4,
    score: 58,
    categories: [
      { label: "Transport", value: 4.8, colorClass: "hsl(var(--transport))" },
      { label: "Food", value: 3.2, colorClass: "hsl(var(--food))" },
      { label: "Energy", value: 2.9, colorClass: "hsl(var(--consumption))" },
      { label: "Goods", value: 1.5, colorClass: "hsl(var(--energy))" },
    ],
  },
  week: {
    total: 78.4,
    score: 74,
    categories: [
      { label: "Transport", value: 27.5, colorClass: "hsl(var(--transport))" },
      { label: "Food", value: 19.6, colorClass: "hsl(var(--food))" },
      { label: "Energy", value: 18.3, colorClass: "hsl(var(--consumption))" },
      { label: "Goods", value: 13, colorClass: "hsl(var(--energy))" },
    ],
  },
  month: {
    total: 310,
    score: 86,
    categories: [
      { label: "Transport", value: 104.5, colorClass: "hsl(var(--transport))" },
      { label: "Food", value: 82.2, colorClass: "hsl(var(--food))" },
      { label: "Energy", value: 70.1, colorClass: "hsl(var(--consumption))" },
      { label: "Goods", value: 53.2, colorClass: "hsl(var(--energy))" },
    ],
  },
};

const activityFeed = [
  {
    id: "1",
    confidence: "High Conf.",
    title: "Commute Detected (GPS)",
    note: "Detected 15 km drive. Estimated emission: 2.8kg CO₂.",
    time: "2m ago",
    primary: "Confirm",
    secondary: "Edit",
  },
  {
    id: "2",
    confidence: "Med Conf.",
    title: "Food Purchase",
    note: "Transaction at 'Green Grocer'. Log as vegetarian meal?",
    time: "1h ago",
    primary: "Yes, Veg",
    secondary: "No",
  },
  {
    id: "3",
    confidence: "Low Conf.",
    title: "High Energy Usage",
    note: "Spike detected on Smart Meter. Is the AC running?",
    time: "3h ago",
    primary: "Check Details",
    secondary: "",
  },
];

const insightCards: InsightData[] = [
  {
    title: "Reduction Goal",
    value: "85",
    unit: "/ 100 kg",
    helper: "+5 pts",
    icon: Check,
    progress: "65%",
    detail: "You are on track to hit your monthly reduction goal by prioritizing low-carbon commuting.",
  },
  {
    title: "Offset Impact",
    value: "2",
    unit: "Trees",
    helper: "Equivalent to 45kg CO₂ absorbed",
    icon: Leaf,
    progress: "40%",
    detail: "Your tree offset contribution came from completed eco missions and joined community challenges.",
  },
  {
    title: "Energy Saved",
    value: "14",
    unit: "kWh",
    helper: "Smart plug automation active",
    icon: Zap,
    progress: "52%",
    detail: "Automation reduced idle appliance usage during peak hours and overnight standby time.",
  },
];

const scoreLabel = (score: number) => {
  if (score <= 30) return "Needs Work";
  if (score <= 60) return "Good";
  if (score <= 80) return "Great";
  return "Excellent";
};

const Index = () => {
  const [period, setPeriod] = useState<Period>("day");
  const [voiceLogOpen, setVoiceLogOpen] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<InsightData | null>(null);
  const { toast } = useToast();

  const userName = getUserName();
  const active = periodData[period];

  const donutStyle = useMemo(() => {
    let start = 0;
    const segments = active.categories.map((item) => {
      const pct = (item.value / active.total) * 100;
      const end = start + pct;
      const segment = `${item.colorClass} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      start = end;
      return segment;
    });

    return { background: `conic-gradient(${segments.join(", ")})` };
  }, [active]);

  const submitVoiceLog = () => {
    if (!voiceInput.trim()) {
      toast({ title: "Add activity", description: "Please type or speak an activity before saving." });
      return;
    }

    toast({
      title: "Activity logged",
      description: `Captured: "${voiceInput.trim()}"`,
    });

    setVoiceInput("");
    setVoiceLogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="px-5 space-y-5 lg:max-w-6xl lg:mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {userName}! Here&apos;s your daily eco-impact.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
              <Leaf className="h-3.5 w-3.5" /> {active.total} kg CO2e
            </span>
            <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary">{scoreLabel(active.score)}</span>
            <button
              type="button"
              onClick={() => setVoiceLogOpen(true)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Voice Log
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-8 rounded-2xl bg-card border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Footprint Tracker</h2>
                <p className="text-sm text-muted-foreground">Distribution by category</p>
              </div>
              <div className="grid grid-cols-3 rounded-lg bg-muted p-1 text-xs">
                {(["day", "week", "month"] as Period[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriod(item)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors ${
                      period === item ? "bg-card text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 flex justify-center md:justify-start">
                <div className="relative h-56 w-56 rounded-full p-3" style={donutStyle}>
                  <div className="absolute inset-6 rounded-full bg-background border border-border flex flex-col items-center justify-center">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</span>
                    <span className="text-4xl font-bold text-foreground leading-none mt-1">{active.total}</span>
                    <span className="text-xs text-muted-foreground mt-1">kg CO2e</span>
                    <span className="text-[11px] font-semibold text-primary mt-2">{scoreLabel(active.score)} · {active.score}/100</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {active.categories.map((category) => (
                  <p key={category.label} className="flex items-center justify-between text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.colorClass }} />
                      {category.label}
                    </span>
                    {category.value} kg
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">
              {insightCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className="rounded-xl bg-background/60 border border-border p-4 space-y-2 text-left hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><card.icon className="h-4 w-4 text-foreground" /></span>
                    <span className="text-[10px] font-bold text-primary">{card.helper}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground leading-none">{card.value} <span className="text-base text-muted-foreground font-medium">{card.unit}</span></p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: card.progress }} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="xl:col-span-4 rounded-2xl bg-card border border-border p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground inline-flex items-center gap-2"><Bot className="h-4.5 w-4.5 text-primary" /> AI Activity Feed</h3>
              <span className="text-[10px] font-bold rounded-full bg-muted px-2 py-1 text-muted-foreground">LIVE</span>
            </div>

            {activityFeed.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3 bg-background/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold rounded-full bg-primary/15 px-2 py-1 text-primary">{item.confidence}</span>
                  <span className="text-[10px] text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold py-2">{item.primary}</button>
                  {item.secondary && <button type="button" className="rounded-lg bg-muted text-muted-foreground text-xs font-semibold px-3 py-2">{item.secondary}</button>}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <Dialog open={voiceLogOpen} onOpenChange={setVoiceLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Log Activity</DialogTitle>
            <DialogDescription>Speak or type your latest carbon activity.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center animate-pulse">
              <Mic className="h-7 w-7 text-primary" />
            </div>
            <textarea
              value={voiceInput}
              onChange={(event) => setVoiceInput(event.target.value)}
              placeholder="Example: I drove 10 km today"
              className="w-full min-h-[110px] rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button type="button" onClick={submitVoiceLog} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
              Save Log
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCard?.title}</DialogTitle>
            <DialogDescription>{selectedCard?.helper}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedCard?.detail}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
