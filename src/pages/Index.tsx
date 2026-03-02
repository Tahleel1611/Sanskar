import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Leaf, Mic, Settings2, Zap } from "lucide-react";
import Header from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getUserName, getUserPreferences, type UserPreferences } from "@/lib/userStorage";
import { analyzeCarbonInput, getCarbonRegion, type CarbonCategory } from "@/lib/carbon/inference";
import { getCarbonAnalysisHistory, getLatestCarbonAnalysis, saveCarbonAnalysis } from "@/lib/carbon/storage";
import { useNavigate } from "react-router-dom";

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

type ImpactCategory = "food" | "transport" | "consumption";

interface ImpactItem {
  id: string;
  title: string;
  category: ImpactCategory;
  impact: number;
  why: string;
  alternate: string;
}

interface BubbleNode extends ImpactItem {
  r: number;
  cx: number;
  cy: number;
}

const PERIOD_WINDOW_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
};

const PERIOD_SCORE_BASELINE_KG: Record<Period, number> = {
  day: 30,
  week: 300,
  month: 2200,
};

const CATEGORY_STYLE: Record<CarbonCategory, { label: string; colorClass: string }> = {
  transport: { label: "Transport", colorClass: "hsl(var(--transport))" },
  food: { label: "Food", colorClass: "hsl(var(--food))" },
  energy: { label: "Energy", colorClass: "hsl(var(--consumption))" },
  goods: { label: "Goods", colorClass: "hsl(var(--energy))" },
};

interface VoiceLogItem {
  id: string;
  text: string;
  time: string;
}

type DashboardModuleKey = "option1" | "option2" | "option3";

interface DashboardModulesState {
  enabled: Record<DashboardModuleKey, boolean>;
  order: DashboardModuleKey[];
}

const VOICE_LOGS_KEY = "eco_voice_logs";
const DASHBOARD_MODULES_KEY = "eco_dashboard_modules";

const fallbackItems: ImpactItem[] = [
  {
    id: "food-fallback",
    title: "Sixth chicken biryani",
    category: "food",
    impact: 92,
    why: "Repeated high-impact meat meals pushed food emissions up sharply today.",
    alternate: "Try egg biryani today instead of chicken for a lighter carbon load.",
  },
  {
    id: "consume-fallback",
    title: "Zara shirt",
    category: "consumption",
    impact: 76,
    why: "Fast fashion purchases add hidden manufacturing and logistics emissions.",
    alternate: "Choose a lower-impact clothing option like thrift, rewear, or local brands.",
  },
  {
    id: "transport-fallback",
    title: "7th day you took car",
    category: "transport",
    impact: 88,
    why: "Daily solo car use remained the largest transport contributor.",
    alternate: "Use Rapido or shared transport tomorrow to cut emissions and travel cost.",
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

const calculateEcoScore = (total: number, period: Period) => {
  const baseline = PERIOD_SCORE_BASELINE_KG[period];
  const ratio = baseline > 0 ? total / baseline : 0;
  return Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));
};

const categoryColor = (category: ImpactCategory) => {
  if (category === "food") return "#F5A623";
  if (category === "transport") return "#4A90D9";
  return "#E05C8A";
};

const titleForTransport = (value?: string) => {
  if (value === "Three+") return "7th day you took car";
  if (value === "Two") return "Another day with frequent car use";
  if (value === "One") return "Daily solo commute pattern";
  return "Car-first travel pattern";
};

const buildDerivedItems = (preferences: Partial<UserPreferences>): ImpactItem[] => {
  const items: ImpactItem[] = [];

  if (preferences.meals === "Once daily" || preferences.meals === "More than once/day") {
    items.push({
      id: "food-derived",
      title: "Sixth chicken biryani",
      category: "food",
      impact: preferences.meals === "More than once/day" ? 94 : 82,
      why: "Frequent animal-protein meals increased food-side footprint today.",
      alternate: "Try egg biryani today instead of chicken for a meaningful CO₂ cut.",
    });
  }

  if (preferences.shopping === "Monthly" || preferences.shopping === "Weekly or more") {
    items.push({
      id: "consumption-derived",
      title: "Zara shirt",
      category: "consumption",
      impact: preferences.shopping === "Weekly or more" ? 84 : 72,
      why: "Frequent apparel purchases usually carry high production + shipping emissions.",
      alternate: "Pick one lower-impact option: thrift, swap, or a long-lasting local alternative.",
    });
  }

  if (preferences.transport && preferences.transport !== "None") {
    items.push({
      id: "transport-derived",
      title: titleForTransport(preferences.transport),
      category: "transport",
      impact: preferences.transport === "Three+" ? 90 : preferences.transport === "Two" ? 80 : 68,
      why: "Vehicle-heavy movement contributed strongly to today’s total footprint.",
      alternate: "Use Rapido or shared transport tomorrow for lower emissions and better cost efficiency.",
    });
  }

  return items;
};

const bubbleLabel = (item: ImpactItem) => {
  const lower = item.title.toLowerCase();
  if (item.category === "food" || lower.includes("biryani") || lower.includes("chicken")) return "Chicken";
  if (item.category === "transport" || lower.includes("car")) return "Car";
  if (lower.includes("zara")) return "Zara";
  return item.title.split(" ")[0];
};

const DEFAULT_DASHBOARD_MODULES: DashboardModulesState = {
  enabled: {
    option1: true,
    option2: false,
    option3: false,
  },
  order: ["option1", "option2", "option3"],
};

const moduleTitle: Record<DashboardModuleKey, string> = {
  option1: "Sparkline + Recent Logs",
  option2: "Quick Stats",
  option3: "Eco Tip Ticker",
};

const Index = () => {
  const [period, setPeriod] = useState<Period>("day");
  const [voiceLogOpen, setVoiceLogOpen] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceLogs, setVoiceLogs] = useState<VoiceLogItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const [selectedCard, setSelectedCard] = useState<InsightData | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [dashboardModules, setDashboardModules] = useState<DashboardModulesState>(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_MODULES_KEY);
      if (!raw) return DEFAULT_DASHBOARD_MODULES;
      const parsed = JSON.parse(raw) as DashboardModulesState;
      if (!parsed?.enabled || !Array.isArray(parsed.order)) return DEFAULT_DASHBOARD_MODULES;
      return parsed;
    } catch {
      return DEFAULT_DASHBOARD_MODULES;
    }
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_LOGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VoiceLogItem[];
        setVoiceLogs(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setVoiceLogs([]);
    }
  }, []);

  useEffect(() => {
    const onAnalysis = () => setAnalysisVersion((value) => value + 1);
    window.addEventListener("eco-carbon-analysis-update", onAnalysis);
    return () => {
      window.removeEventListener("eco-carbon-analysis-update", onAnalysis);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_MODULES_KEY, JSON.stringify(dashboardModules));
  }, [dashboardModules]);

  const userName = getUserName();

  const computedPeriodData = useMemo(() => {
    const now = Date.now();
    const history = getCarbonAnalysisHistory();

    return (Object.keys(PERIOD_WINDOW_DAYS) as Period[]).reduce<Record<Period, { total: number; score: number; categories: CategoryData[] }>>((acc, key) => {
      const cutoff = now - PERIOD_WINDOW_DAYS[key] * 24 * 60 * 60 * 1000;
      const relevant = history.filter((item) => new Date(item.createdAt).getTime() >= cutoff);

      const categoryTotals: Record<CarbonCategory, number> = {
        transport: 0,
        food: 0,
        energy: 0,
        goods: 0,
      };

      let total = 0;
      for (const item of relevant) {
        total += item.totalKgCo2e;
        categoryTotals.transport += item.categoryTotals.transport;
        categoryTotals.food += item.categoryTotals.food;
        categoryTotals.energy += item.categoryTotals.energy;
        categoryTotals.goods += item.categoryTotals.goods;
      }

      const roundedTotal = parseFloat(total.toFixed(2));
      const categories: CategoryData[] = (Object.keys(CATEGORY_STYLE) as CarbonCategory[]).map((categoryKey) => ({
        label: CATEGORY_STYLE[categoryKey].label,
        colorClass: CATEGORY_STYLE[categoryKey].colorClass,
        value: parseFloat(categoryTotals[categoryKey].toFixed(2)),
      }));

      acc[key] = {
        total: roundedTotal,
        score: calculateEcoScore(roundedTotal, key),
        categories,
      };

      return acc;
    }, {
      day: { total: 0, score: 100, categories: [] },
      week: { total: 0, score: 100, categories: [] },
      month: { total: 0, score: 100, categories: [] },
    });
  }, [analysisVersion]);

  const active = computedPeriodData[period];

  const trendBars = useMemo(() => {
    const points = getCarbonAnalysisHistory().slice(0, 6).reverse();
    const max = Math.max(0.01, ...points.map((item) => item.totalKgCo2e));
    return points.map((item) => ({
      key: item.createdAt,
      total: item.totalKgCo2e,
      height: item.totalKgCo2e > 0 ? Math.max(14, (item.totalKgCo2e / max) * 90) : 0,
    }));
  }, [analysisVersion]);

  const recentLogsWithEmission = useMemo(() => {
    const history = getCarbonAnalysisHistory();
    return voiceLogs.slice(0, 4).map((log, index) => ({
      ...log,
      emission: history[index]?.totalKgCo2e ?? null,
    }));
  }, [voiceLogs, analysisVersion]);

  const quickStats = useMemo(() => {
    const history = getCarbonAnalysisHistory();
    const last7 = history.filter((item) => new Date(item.createdAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyAvg = last7.length ? last7.reduce((sum, item) => sum + item.totalKgCo2e, 0) / 7 : 0;

    const uniqueDays = [...new Set(history.map((item) => new Date(item.createdAt).toDateString()))]
      .map((day) => new Date(day).getTime())
      .sort((a, b) => b - a);

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const day of uniqueDays) {
      if (day === cursor.getTime()) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    return {
      streak,
      weeklyAvg: parseFloat(weeklyAvg.toFixed(1)),
      rank: "#42",
    };
  }, [analysisVersion]);

  const topCategory = useMemo(() => {
    const sorted = active.categories.slice().sort((a, b) => b.value - a.value);
    return sorted[0]?.label ?? "Transport";
  }, [active]);

  const ecoTips = useMemo(() => {
    const tipsByCategory: Record<string, string[]> = {
      Transport: [
        "💡 Tip: Sharing a 10 km car trip can cut per-person emissions by ~50%.",
        "💡 Tip: One metro commute can save ~1-2 kg CO₂ versus solo driving.",
      ],
      Food: [
        "💡 Tip: Switching from chicken to paneer can save ~2.1 kg CO₂ per meal.",
        "💡 Tip: Plant-forward meals usually have lower lifecycle emissions.",
      ],
      Energy: [
        "💡 Tip: Reducing AC runtime by 1 hour/day can noticeably lower footprint.",
        "💡 Tip: Use fans first, then AC only when needed.",
      ],
      Goods: [
        "💡 Tip: Delaying one fast-fashion purchase can avoid hidden production emissions.",
        "💡 Tip: Thrift or rewear first to reduce goods-related CO₂.",
      ],
    };
    return tipsByCategory[topCategory] ?? tipsByCategory.Transport;
  }, [topCategory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((value) => value + 1);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const toggleModule = (key: DashboardModuleKey) => {
    setDashboardModules((prev) => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [key]: !prev.enabled[key],
      },
    }));
  };

  const moveModule = (key: DashboardModuleKey, direction: "up" | "down") => {
    setDashboardModules((prev) => {
      const index = prev.order.indexOf(key);
      if (index < 0) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.order.length) return prev;
      const next = prev.order.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, order: next };
    });
  };

  const activeDashboardModules = dashboardModules.order.filter((key) => dashboardModules.enabled[key]);

  const trendDelta = useMemo(() => {
    const points = getCarbonAnalysisHistory().slice(0, 2);
    if (points.length < 2) return null;
    return parseFloat((points[0].totalKgCo2e - points[1].totalKgCo2e).toFixed(2));
  }, [analysisVersion]);

  const impactItems = useMemo(() => {
    const latestAnalysis = getLatestCarbonAnalysis();
    if (latestAnalysis && latestAnalysis.activities.length > 0 && latestAnalysis.totalKgCo2e > 0) {
      const modelItems = latestAnalysis.activities
        .slice()
        .sort((a, b) => b.co2Kg - a.co2Kg)
        .slice(0, 3)
        .map((activity, index) => ({
          id: `model-${activity.factorKey}-${index}`,
          title: activity.label,
          category: (activity.category === "goods" ? "consumption" : activity.category) as ImpactCategory,
          impact: Math.max(8, Math.round((activity.co2Kg / latestAnalysis.totalKgCo2e) * 100)),
          why: activity.why,
          alternate: activity.alternate,
        }));

      if (modelItems.length >= 3) {
        return modelItems;
      }

      return [...modelItems, ...fallbackItems.filter((fallback) => !modelItems.some((item) => item.category === fallback.category))].slice(0, 3);
    }

    const preferences = getUserPreferences();
    const derived = buildDerivedItems(preferences);
    const merged = [...derived, ...fallbackItems.filter((fallback) => !derived.some((item) => item.category === fallback.category))];
    return merged.sort((a, b) => b.impact - a.impact).slice(0, 3);
  }, [analysisVersion]);

  const bubbleNodes = useMemo<BubbleNode[]>(() => {
    const CHART_WIDTH = 380;
    const BASELINE_Y = 208;
    const touchGap = 2;
    const top = impactItems.slice(0, 3).sort((a, b) => b.impact - a.impact);
    if (top.length === 0) return [];

    const maxImpact = Math.max(...top.map((item) => item.impact), 1);
    const minImpact = Math.min(...top.map((item) => item.impact), maxImpact);
    const radiusFromImpact = (impact: number) => {
      if (maxImpact === minImpact) return 82;
      const normalized = (impact - minImpact) / (maxImpact - minImpact);
      return 72 + Math.pow(normalized, 1.6) * 18;
    };

    const first = top[0];
    const second = top[1];
    const third = top[2];

    const nodes: BubbleNode[] = [];
    const firstNode: BubbleNode = {
      ...first,
      r: radiusFromImpact(first.impact),
      cx: CHART_WIDTH * 0.31,
      cy: BASELINE_Y,
    };
    nodes.push(firstNode);

    if (second) {
      const secondRadius = radiusFromImpact(second.impact);
      const secondNode: BubbleNode = {
        ...second,
        r: secondRadius,
        cx: firstNode.cx + firstNode.r + secondRadius + touchGap,
        cy: BASELINE_Y,
      };
      nodes.push(secondNode);

      if (third) {
        const thirdRadius = radiusFromImpact(third.impact);
        const D = Math.max(1, secondNode.cx - firstNode.cx);
        const d1 = firstNode.r + thirdRadius + touchGap;
        const d2 = secondNode.r + thirdRadius + touchGap;
        const xFromFirst = (d1 * d1 - d2 * d2 + D * D) / (2 * D);
        const yOffset = Math.sqrt(Math.max(0, d1 * d1 - xFromFirst * xFromFirst));

        nodes.push({
          ...third,
          r: thirdRadius,
          cx: firstNode.cx + xFromFirst,
          cy: BASELINE_Y - yOffset,
        });
      }
    }

    return nodes;
  }, [impactItems]);

  const donutStyle = useMemo(() => {
    let start = 0;
    const segments = active.categories.map((item) => {
      const pct = active.total > 0 ? (item.value / active.total) * 100 : 0;
      const end = start + pct;
      const segment = `${item.colorClass} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      start = end;
      return segment;
    });

    return {
      background: active.total > 0 ? `conic-gradient(${segments.join(", ")})` : "conic-gradient(hsl(var(--muted)) 0% 100%)",
    };
  }, [active]);

  const submitVoiceLog = async () => {
    if (!voiceInput.trim()) {
      toast({ title: "Add activity", description: "Please type or speak an activity before saving." });
      return;
    }

    const submittedText = voiceInput.trim();

    const nextEntry: VoiceLogItem = {
      id: Date.now().toString(),
      text: submittedText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextLogs = [nextEntry, ...voiceLogs].slice(0, 5);
    setVoiceLogs(nextLogs);
    localStorage.setItem(VOICE_LOGS_KEY, JSON.stringify(nextLogs));

    toast({
      title: "Activity logged",
      description: `Captured: "${submittedText}"`,
    });

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeCarbonInput(submittedText, getCarbonRegion());
      await saveCarbonAnalysis(analysis);

      toast({
        title: "Carbon analysis updated",
        description: analysis.activities.length
          ? `${analysis.activities.length} ${analysis.activities.length === 1 ? "activity" : "activities"} detected · ${analysis.totalKgCo2e} kg CO₂e estimated.`
          : "No known activity pattern matched. Try adding more detail (distance, item, brand, or duration).",
      });
    } catch {
      toast({
        title: "Analysis unavailable",
        description: "Saved your log, but could not run carbon analysis right now.",
      });
    } finally {
      setIsAnalyzing(false);
    }

    setVoiceInput("");
    setVoiceLogOpen(false);
  };

  const startVoiceCapture = () => {
    const RecognitionCtor = (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      toast({ title: "Voice input not supported", description: "Please type your activity on this device/browser." });
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: { results: { 0: { transcript: string } }[] }) => {
      const transcript = event.results[0][0].transcript;
      setVoiceInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Could not capture voice", description: "Please try again or type manually." });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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
              <Leaf className="h-3.5 w-3.5" /> {active.total.toFixed(1)} kg CO2e
            </span>
            <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary">{scoreLabel(active.score)}</span>
            {trendDelta !== null && (
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${trendDelta <= 0 ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
                Trend {trendDelta > 0 ? `+${trendDelta}` : trendDelta} kg
              </span>
            )}
            <button
              type="button"
              onClick={() => setVoiceLogOpen(true)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Voice Log
            </button>
            <button
              type="button"
              onClick={() => navigate("/carbon-lens")}
              className="rounded-full bg-muted px-4 py-2 text-xs font-bold text-foreground"
            >
              Carbon Lens
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
                    <span className="text-4xl font-bold text-foreground leading-none mt-1">{active.total.toFixed(1)}</span>
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
                    {category.value.toFixed(1)} kg
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

            <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3 relative">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard Modules</p>
                <button
                  type="button"
                  onClick={() => setShowCustomize((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-foreground"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Customize Dashboard
                </button>
              </div>

              {showCustomize && (
                <div className="rounded-lg border border-border bg-background p-2.5 space-y-2">
                  {dashboardModules.order.map((moduleKey) => (
                    <div key={`cfg-${moduleKey}`} className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleModule(moduleKey)}
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${dashboardModules.enabled[moduleKey] ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {dashboardModules.enabled[moduleKey] ? "Shown" : "Hidden"}
                      </button>
                      <p className="text-xs text-foreground flex-1">{moduleTitle[moduleKey]}</p>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveModule(moduleKey, "up")} className="rounded border border-border px-1.5 py-0.5 text-[10px]">↑</button>
                        <button type="button" onClick={() => moveModule(moduleKey, "down")} className="rounded border border-border px-1.5 py-0.5 text-[10px]">↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeDashboardModules.length === 0 && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No modules selected. Enable one from Customize Dashboard.
                </div>
              )}

              {activeDashboardModules.map((moduleKey) => (
                <div key={`module-${moduleKey}`}>
                  {moduleKey === "option1" && (
                    <div className="rounded-xl border border-border bg-card p-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-3 rounded-lg border border-border bg-background/70 p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carbon Lens Sparkline</p>
                          <p className="text-[11px] text-muted-foreground">Last {trendBars.length} runs</p>
                        </div>
                        <div className="mt-2 h-24 flex items-end gap-1.5">
                          {trendBars.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No runs yet.</p>
                          ) : (
                            trendBars.map((bar) => (
                              <div key={`spark-${bar.key}`} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">{bar.total.toFixed(1)}</span>
                                <div className="w-full rounded-sm bg-primary/65" style={{ height: `${bar.height}%` }} title={`${bar.total.toFixed(2)} kg`} />
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2 rounded-lg border border-border bg-background/70 p-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Voice Logs</p>
                        <div className="mt-2 space-y-2">
                          {recentLogsWithEmission.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No logs yet.</p>
                          ) : (
                            recentLogsWithEmission.map((entry) => (
                              <div key={`recent-log-${entry.id}`} className="rounded-md border border-border bg-muted/40 px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground">{entry.time}</p>
                                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    {entry.emission !== null ? `${entry.emission.toFixed(1)} kg` : "—"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-foreground truncate mt-1">{entry.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {moduleKey === "option2" && (
                    <div className="rounded-xl border border-border bg-card p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="rounded-lg border border-border bg-background/70 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">🔥 Streak</p>
                        <p className="text-sm font-bold text-foreground">{quickStats.streak} days logged</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background/70 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">📊 Weekly avg</p>
                        <p className="text-sm font-bold text-foreground">{quickStats.weeklyAvg} kg/day</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background/70 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">🏆 Rank</p>
                        <p className="text-sm font-bold text-foreground">{quickStats.rank}</p>
                      </div>
                    </div>
                  )}

                  {moduleKey === "option3" && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eco Tip</p>
                      <p className="text-sm text-foreground mt-2">{ecoTips[tipIndex % ecoTips.length]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/what-went-wrong")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/what-went-wrong");
              }
            }}
            className="xl:col-span-4 rounded-2xl bg-card border border-border p-4 shadow-card space-y-3 cursor-pointer transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">What went wrong today?</h3>
              <p className="text-xs text-muted-foreground mt-1">Reflection helps, blame doesn&apos;t. Here are today&apos;s highest-impact actions and easy swaps for tomorrow.</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-xs font-semibold text-foreground">Carbon footprint hotspots</p>
              <div className="mt-3 space-y-2">
                {impactItems.map((item) => (
                  <div key={`legend-${item.id}`} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(item.category) }} />
                      {item.title}
                    </span>
                    <span className="font-semibold text-foreground">{item.impact}%</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-center">
                <div className="relative h-[300px] min-h-[300px] w-full max-w-[380px]">
                  <svg className="h-[300px] w-full" viewBox="0 0 380 300" role="img" aria-label="Carbon footprint hotspot bubble chart">
                    <defs>
                      <filter id="bubbleShadowIndex" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.16" />
                      </filter>
                    </defs>

                    {bubbleNodes.map((item, index) => (
                      <g
                        key={`layer-${item.id}`}
                        className={`bubble-float bubble-float-${(index % 3) + 1}`}
                        style={{ transformOrigin: `${item.cx}px ${item.cy}px` }}
                      >
                        <circle
                          cx={item.cx}
                          cy={item.cy}
                          r={item.r}
                          fill={categoryColor(item.category)}
                          opacity={0.85}
                          filter="url(#bubbleShadowIndex)"
                        >
                          <title>{`${item.title} · ${item.impact}%`}</title>
                        </circle>
                        <text x={item.cx} y={item.cy - 4} fill="#FFFFFF" textAnchor="middle" fontSize="14" fontWeight="700">
                          {bubbleLabel(item)}
                        </text>
                        <text x={item.cx} y={item.cy + 16} fill="#FFFFFF" textAnchor="middle" fontSize="16" fontWeight="800">
                          {item.impact}%
                        </text>
                      </g>
                    ))}

                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-xs font-semibold text-foreground">High-impact activities</p>
              <ul className="mt-2 space-y-2">
                {impactItems.map((item) => (
                  <li key={`problem-${item.id}`} className="rounded-lg border border-border bg-background/70 p-2.5">
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{item.why}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-foreground">Alternates</p>
              <ul className="mt-2 space-y-2">
                {impactItems.map((item) => (
                  <li key={`alternate-${item.id}`} className="text-[11px] text-foreground">• {item.alternate}</li>
                ))}
              </ul>
            </div>

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
            <button
              type="button"
              onClick={startVoiceCapture}
              className="w-full rounded-lg border border-border bg-muted py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80"
              disabled={isListening || isAnalyzing}
            >
              {isListening ? "Listening..." : "Tap to Speak"}
            </button>
            <textarea
              value={voiceInput}
              onChange={(event) => setVoiceInput(event.target.value)}
              placeholder="Example: I drove 10 km today"
              className="w-full min-h-[110px] rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="button"
              onClick={submitVoiceLog}
              disabled={isAnalyzing}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {isAnalyzing ? "Saving & analyzing..." : "Save Log"}
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
