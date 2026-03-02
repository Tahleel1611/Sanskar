import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { getUserPreferences, type UserPreferences } from "@/lib/userStorage";
import { getLatestCarbonAnalysis } from "@/lib/carbon/storage";
import { useNavigate } from "react-router-dom";

type ImpactCategory = "food" | "transport" | "consumption";

interface ImpactItem {
  id: string;
  title: string;
  category: ImpactCategory;
  impact: number;
  why: string;
  alternate: string;
  sourceTag: string;
}

interface BubbleNode extends ImpactItem {
  r: number;
  cx: number;
  cy: number;
}

const fallbackItems: ImpactItem[] = [
  {
    id: "food-fallback",
    title: "Sixth chicken biryani",
    category: "food",
    impact: 92,
    why: "Repeated high-impact meat meals pushed food emissions up sharply today.",
    alternate: "Try egg biryani today instead of chicken for a lighter carbon load.",
    sourceTag: "Profile inference",
  },
  {
    id: "consume-fallback",
    title: "Zara shirt",
    category: "consumption",
    impact: 76,
    why: "Fast fashion purchases add hidden manufacturing and logistics emissions.",
    alternate: "Choose a lower-impact clothing option like thrift, rewear, or local brands.",
    sourceTag: "Profile inference",
  },
  {
    id: "transport-fallback",
    title: "7th day you took car",
    category: "transport",
    impact: 88,
    why: "Daily solo car use remained the largest transport contributor.",
    alternate: "Use Rapido or shared transport tomorrow to cut emissions and travel cost.",
    sourceTag: "Profile inference",
  },
];

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

const bubbleLabel = (item: ImpactItem) => {
  const lower = item.title.toLowerCase();
  if (item.category === "food" || lower.includes("biryani") || lower.includes("chicken")) return "Chicken";
  if (item.category === "transport" || lower.includes("car")) return "Car";
  if (lower.includes("zara")) return "Zara";
  return item.title.split(" ")[0];
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
      sourceTag: "Profile inference",
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
      sourceTag: "Profile inference",
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
      sourceTag: "Profile inference",
    });
  }

  return items;
};

const WhatWentWrongToday = () => {
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onAnalysis = () => setAnalysisVersion((value) => value + 1);
    window.addEventListener("eco-carbon-analysis-update", onAnalysis);
    return () => {
      window.removeEventListener("eco-carbon-analysis-update", onAnalysis);
    };
  }, []);

  const items = useMemo(() => {
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
          sourceTag: "Carbon Lens model",
        }));

      if (modelItems.length >= 3) {
        return modelItems;
      }

      const mergedFromModel = [
        ...modelItems,
        ...fallbackItems.filter((fallback) => !modelItems.some((item) => item.category === fallback.category)),
      ];

      return mergedFromModel.slice(0, 3);
    }

    const preferences = getUserPreferences();
    const derived = buildDerivedItems(preferences);
    const merged = [...derived, ...fallbackItems.filter((fallback) => !derived.some((d) => d.category === fallback.category))];
    return merged.sort((a, b) => b.impact - a.impact).slice(0, 3);
  }, [analysisVersion]);

  const bubbleNodes = useMemo<BubbleNode[]>(() => {
    const CHART_WIDTH = 380;
    const BASELINE_Y = 208;
    const touchGap = 2;
    const top = items.slice(0, 3);
    if (top.length === 0) return [];

    const maxImpact = Math.max(...top.map((item) => item.impact), 1);
    const minImpact = Math.min(...top.map((item) => item.impact), maxImpact);
    const radiusFromImpact = (impact: number) => {
      if (maxImpact === minImpact) return 82;
      const normalized = (impact - minImpact) / (maxImpact - minImpact);
      return 72 + Math.pow(normalized, 1.6) * 18;
    };

    const sorted = top.slice().sort((a, b) => b.impact - a.impact);
    const first = sorted[0];
    const second = sorted[1];
    const third = sorted[2];

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
  }, [items]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="px-5 space-y-5 lg:max-w-4xl lg:mx-auto">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">What went wrong today?</h1>
          <p className="text-sm text-muted-foreground">
            Reflection helps, blame doesn’t. Here are today’s highest-impact actions and easy swaps for tomorrow.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="grid md:grid-cols-2 gap-5 items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Carbon footprint hotspots</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bigger and darker zones show where emissions were highest.
              </p>

              <div className="space-y-2 mt-4">
                {items.map((item) => (
                  <div key={`legend-${item.id}`} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(item.category) }} />
                      {item.title}
                    </span>
                    <span className="font-semibold text-foreground">{item.impact}%</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate("/carbon-lens/scanner")}
                className="mt-4 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-left"
              >
                <p className="text-sm font-semibold text-foreground">📷 Scan Product</p>
                <p className="text-xs text-muted-foreground mt-1">Scan the product you bought → Get its full carbon report</p>
              </button>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative h-[300px] min-h-[300px] w-full max-w-[380px]">
                <svg className="h-[300px] w-full" viewBox="0 0 380 300" role="img" aria-label="Carbon footprint hotspot bubble chart">
                  <defs>
                    <filter id="bubbleShadow" x="-30%" y="-30%" width="160%" height="160%">
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
                        filter="url(#bubbleShadow)"
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
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-3">
          <h2 className="text-base font-semibold text-foreground">High-impact activities</h2>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={`problem-${item.id}`} className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(item.category) }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{item.sourceTag}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.why}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-3">
          <h2 className="text-base font-semibold text-foreground">Alternates</h2>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={`alternate-${item.id}`} className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <p className="text-sm text-foreground">{item.alternate}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default WhatWentWrongToday;