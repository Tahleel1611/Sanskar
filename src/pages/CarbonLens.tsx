import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { analyzeCarbonInput, getCarbonRegion, setCarbonRegion, type CarbonAnalysisResult, type CarbonCategory, type CarbonRegion } from "@/lib/carbon/inference";
import { getCarbonAnalysisHistory, getLatestCarbonAnalysis, saveCarbonAnalysis } from "@/lib/carbon/storage";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const quickPrompts = [
  "Drove my car 14 km and ordered chicken biryani",
  "Ran AC for 4 hours and bought a new T-shirt",
  "Took metro 9 km and had a vegetarian meal",
  "Used washing machine once and ordered food delivery",
];

const deltaLabel = (value: number) => {
  if (Math.abs(value) < 0.01) return "No change";
  return value > 0 ? `+${value.toFixed(2)} kg` : `${value.toFixed(2)} kg`;
};

const CarbonLens = () => {
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [region, setRegion] = useState<CarbonRegion>(getCarbonRegion());
  const [activeCategory, setActiveCategory] = useState<"all" | CarbonCategory>("all");
  const [latest, setLatest] = useState(getLatestCarbonAnalysis());
  const [history, setHistory] = useState(getCarbonAnalysisHistory());
  const [selectedTrendRun, setSelectedTrendRun] = useState<CarbonAnalysisResult | null>(null);
  const [historyCount, setHistoryCount] = useState(getCarbonAnalysisHistory().length);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => {
      setLatest(getLatestCarbonAnalysis());
      const nextHistory = getCarbonAnalysisHistory();
      setHistory(nextHistory);
      setHistoryCount(nextHistory.length);
    };

    const syncRegion = () => {
      setRegion(getCarbonRegion());
    };

    window.addEventListener("eco-carbon-analysis-update", sync);
    window.addEventListener("eco-carbon-region-update", syncRegion);
    return () => {
      window.removeEventListener("eco-carbon-analysis-update", sync);
      window.removeEventListener("eco-carbon-region-update", syncRegion);
    };
  }, []);

  const topActivities = useMemo(() => {
    if (!latest) return [];
    const base = latest.activities.slice().sort((a, b) => b.co2Kg - a.co2Kg);
    if (activeCategory === "all") return base.slice(0, 8);
    return base.filter((item) => item.category === activeCategory).slice(0, 8);
  }, [latest, activeCategory]);

  const trendPoints = useMemo(() => {
    const points = history
      .slice()
      .filter((item) => item.region === region)
      .slice(0, 7)
      .reverse()
      .map((item, index) => ({
        x: index + 1,
        total: item.totalKgCo2e,
        date: new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
        run: item,
      }));

    const max = Math.max(0.01, ...points.map((item) => item.total));
    return points.map((item) => ({ ...item, height: (item.total / max) * 100 }));
  }, [history, region]);

  useEffect(() => {
    if (trendPoints.length === 0) {
      setSelectedTrendRun(null);
      return;
    }

    if (!selectedTrendRun || selectedTrendRun.region !== region) {
      setSelectedTrendRun(trendPoints[trendPoints.length - 1].run);
    }
  }, [trendPoints, selectedTrendRun, region]);

  const selectedTrendBars = useMemo(() => {
    if (!selectedTrendRun) return [];

    const pairs: Array<{ key: string; label: string; value: number }> = [
      { key: "transport", label: "Transport", value: selectedTrendRun.categoryTotals.transport },
      { key: "food", label: "Food", value: selectedTrendRun.categoryTotals.food },
      { key: "energy", label: "Energy", value: selectedTrendRun.categoryTotals.energy },
      { key: "goods", label: "Goods/Lifestyle", value: selectedTrendRun.categoryTotals.goods },
    ];

    const max = Math.max(0.01, ...pairs.map((item) => item.value));
    return pairs.map((item) => ({ ...item, width: (item.value / max) * 100 }));
  }, [selectedTrendRun]);

  const selectedVsLatest = useMemo(() => {
    if (!selectedTrendRun || !latest || selectedTrendRun.createdAt === latest.createdAt) {
      return null;
    }

    return {
      total: selectedTrendRun.totalKgCo2e - latest.totalKgCo2e,
      transport: selectedTrendRun.categoryTotals.transport - latest.categoryTotals.transport,
      food: selectedTrendRun.categoryTotals.food - latest.categoryTotals.food,
      energy: selectedTrendRun.categoryTotals.energy - latest.categoryTotals.energy,
      goods: selectedTrendRun.categoryTotals.goods - latest.categoryTotals.goods,
    };
  }, [selectedTrendRun, latest]);

  const categoryBars = useMemo(() => {
    if (!latest) return [];
    const pairs: Array<{ key: string; label: string; value: number }> = [
      { key: "transport", label: "Transport", value: latest.categoryTotals.transport },
      { key: "food", label: "Food", value: latest.categoryTotals.food },
      { key: "energy", label: "Energy", value: latest.categoryTotals.energy },
      { key: "goods", label: "Goods/Lifestyle", value: latest.categoryTotals.goods },
    ];

    const max = Math.max(0.01, ...pairs.map((item) => item.value));
    return pairs.map((item) => ({ ...item, width: (item.value / max) * 100 }));
  }, [latest]);

  const runAnalysis = async () => {
    if (!input.trim()) {
      toast({ title: "Add input", description: "Describe your activity in one sentence to analyze it." });
      return;
    }

    setIsRunning(true);
    try {
      const result = await analyzeCarbonInput(input, region);
      await saveCarbonAnalysis(result);
      toast({ title: "Analysis saved", description: `${result.totalKgCo2e} kg CO₂e estimated from your input.` });
      setInput("");
    } catch {
      toast({ title: "Analysis failed", description: "Could not run Carbon Lens right now. Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="px-5 space-y-5 lg:max-w-4xl lg:mx-auto">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Carbon Lens</h1>
          <p className="text-sm text-muted-foreground">Analyze free-text activity logs into estimated carbon impact (India-default factors for MVP).</p>
          <div className="mt-2 inline-flex rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setCarbonRegion("india");
                setRegion("india");
              }}
              className={`px-3 py-1 rounded-md ${region === "india" ? "bg-card text-foreground" : "text-muted-foreground"}`}
            >
              India
            </button>
            <button
              type="button"
              onClick={() => {
                setCarbonRegion("global");
                setRegion("global");
              }}
              className={`px-3 py-1 rounded-md ${region === "global" ? "bg-card text-foreground" : "text-muted-foreground"}`}
            >
              Global Lite
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-base font-semibold text-foreground">📸 Scan a Product for CO₂</p>
              <p className="text-xs text-muted-foreground mt-1">Open AI scanner for a full product lifecycle report.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/carbon-lens/scanner")}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Scan Product
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Example: Drove my Honda City 18 km and had chicken biryani"
            className="w-full min-h-[110px] rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="button"
            onClick={runAnalysis}
            disabled={isRunning}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
          >
            {isRunning ? "Analyzing..." : "Run Carbon Lens"}
          </button>
          {!input.trim() && (
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest result</p>
          {!latest ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No analysis yet. Start with one sentence that includes distance, item, duration, or quantity.</p>
              <p className="text-xs text-muted-foreground">Examples: “Bike commute 6 km”, “Chicken biryani and cola”, “AC for 3 hours”.</p>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{latest.totalKgCo2e.toFixed(2)} kg CO₂e</p>
              <p className="text-xs text-muted-foreground">
                Region: {latest.region === "global" ? "Global Lite" : "India"} · Range: {latest.confidenceInterval[0].toFixed(2)} - {latest.confidenceInterval[1].toFixed(2)} kg · {latest.activities.length} matched activities · {historyCount} saved analyses
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1">
                <p className="rounded-lg bg-muted/50 border border-border px-3 py-2">Transport: {latest.categoryTotals.transport.toFixed(2)} kg</p>
                <p className="rounded-lg bg-muted/50 border border-border px-3 py-2">Food: {latest.categoryTotals.food.toFixed(2)} kg</p>
                <p className="rounded-lg bg-muted/50 border border-border px-3 py-2">Energy: {latest.categoryTotals.energy.toFixed(2)} kg</p>
                <p className="rounded-lg bg-muted/50 border border-border px-3 py-2">Goods/Lifestyle: {latest.categoryTotals.goods.toFixed(2)} kg</p>
              </div>
            </>
          )}
        </section>

        {latest && (
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Category impact chart</h2>
            <div className="space-y-2">
              {categoryBars.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.label}</span>
                    <span>{item.value.toFixed(2)} kg</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.width}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {trendPoints.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Recent trend</h2>
              <p className="text-xs text-muted-foreground">Last {trendPoints.length} analyses ({region === "india" ? "India" : "Global Lite"})</p>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-32">
              {trendPoints.map((point) => (
                <button
                  key={`${point.date}-${point.x}`}
                  type="button"
                  onClick={() => setSelectedTrendRun(point.run)}
                  className="flex flex-col items-center justify-end gap-1"
                >
                  <div
                    className={`w-full rounded-t ${selectedTrendRun?.createdAt === point.run.createdAt ? "bg-primary" : "bg-primary/55"}`}
                    style={{ height: `${Math.max(8, point.height)}%` }}
                  />
                  <p className="text-[10px] text-muted-foreground leading-none">{point.date}</p>
                </button>
              ))}
            </div>

            {selectedTrendRun && (
              <div className="rounded-xl border border-border bg-background/50 p-3 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected run</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(selectedTrendRun.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTrendRun.totalKgCo2e.toFixed(2)} kg CO₂e · range {selectedTrendRun.confidenceInterval[0].toFixed(2)} - {selectedTrendRun.confidenceInterval[1].toFixed(2)} kg
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setInput(selectedTrendRun.input)}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold text-foreground"
                    >
                      Re-run this input
                    </button>
                    {selectedVsLatest && (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${selectedVsLatest.total <= 0 ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
                        vs latest: {deltaLabel(selectedVsLatest.total)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedTrendBars.map((item) => (
                    <div key={`selected-${item.key}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.label}</span>
                        <span className="inline-flex items-center gap-2">
                          <span>{item.value.toFixed(2)} kg</span>
                          {selectedVsLatest && (
                            <span className={`${selectedVsLatest[item.key as keyof typeof selectedVsLatest] <= 0 ? "text-primary" : "text-foreground"}`}>
                              {deltaLabel(selectedVsLatest[item.key as keyof typeof selectedVsLatest])}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.width}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Activities</p>
                  {selectedTrendRun.activities.slice(0, 5).map((item) => (
                    <div key={`selected-act-${item.id}`} className="flex items-center justify-between text-xs rounded-lg bg-muted/40 border border-border px-2.5 py-1.5">
                      <span className="text-foreground truncate pr-2">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.co2Kg.toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {topActivities.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">Top activities</h2>
              <div className="inline-flex rounded-lg bg-muted p-1 text-xs">
                {(["all", "transport", "food", "energy", "goods"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveCategory(item)}
                    className={`px-2.5 py-1 rounded-md capitalize ${activeCategory === item ? "bg-card text-foreground" : "text-muted-foreground"}`}
                  >
                    {item === "all" ? "All" : item}
                  </button>
                ))}
              </div>
            </div>
            <ul className="space-y-2">
              {topActivities.map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.confidenceReason}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{item.co2Kg.toFixed(2)} kg</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{item.alternate}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default CarbonLens;
