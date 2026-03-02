export type CarbonCategory = "transport" | "food" | "energy" | "goods";
export type CarbonRegion = "india" | "global";

type RawModel = {
  emission_graph: Record<string, Record<string, ModelFactor>>;
  ner_patterns: Record<string, Record<string, string[]>>;
};

type ModelFactor = {
  base_factor?: number;
  use_factor?: number;
  purchase_kg?: number;
  daily_amortized?: number;
  lifespan_days?: number;
  unit?: string;
  brands?: Record<string, { multiplier?: number }>;
};

export interface CarbonActivity {
  id: string;
  sourceCategory: string;
  category: CarbonCategory;
  factorKey: string;
  label: string;
  quantity: number;
  unit: string;
  baseFactor: number;
  brandMultiplier: number;
  co2Kg: number;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
  why: string;
  alternate: string;
}

export interface CarbonAnalysisResult {
  input: string;
  createdAt: string;
  region: CarbonRegion;
  totalKgCo2e: number;
  uncertaintyKg: number;
  confidenceInterval: [number, number];
  categoryTotals: Record<CarbonCategory, number>;
  activities: CarbonActivity[];
  summary: string;
}

let modelPromise: Promise<RawModel> | null = null;

const REGION_STORAGE_KEY = "eco_carbon_region";

const categoryMap: Record<string, CarbonCategory> = {
  transport: "transport",
  food: "food",
  energy: "energy",
  fashion: "goods",
  electronics: "goods",
  lifestyle: "goods",
  entertainment: "goods",
};

const fallbackAlternatives: Record<CarbonCategory, string> = {
  transport: "Try a metro, bus, bike, or shared ride for part of this trip.",
  food: "Swap to a plant-forward option or reduce portion size for lower footprint.",
  energy: "Reduce appliance runtime and shift heavy usage outside peak hours.",
  goods: "Choose durable, second-hand, or slower shipping alternatives when possible.",
};

const FALLBACK_FACTOR_PATTERNS: Record<string, string[]> = {
  car_petrol_sedan: ["\\bdrove?\\b[^.\\n]*\\b\\d+(?:\\.\\d+)?\\s*(?:km|kilometer|kilometre|kms)\\b", "\\bcommute\\b[^.\\n]*\\b\\d+(?:\\.\\d+)?\\s*(?:km|kilometer|kilometre|kms)\\b"],
  chicken_biryani: ["\\bchicken\\s+biryani\\b", "\\bbiryani\\b"],
  veg_biryani: ["\\bveg(?:etable)?\\s+biryani\\b"],
  mutton_biryani: ["\\bmutton\\s+biryani\\b"],
  beef_biryani: ["\\bbeef\\s+biryani\\b"],
  milk_100ml: ["\\bglass\\s+of\\s+milk\\b", "\\bmilk\\b"],
};

const REGION_MULTIPLIER: Record<CarbonRegion, Partial<Record<CarbonCategory, number>>> = {
  india: {
    transport: 1,
    food: 1,
    energy: 1,
    goods: 1,
  },
  global: {
    transport: 0.92,
    food: 0.9,
    energy: 0.8,
    goods: 0.95,
  },
};

const TEXT_NUMBER_MAP: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const toTitle = (raw: string) => raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const safePatternTest = (pattern: string, text: string) => {
  try {
    return new RegExp(pattern, "i").test(text);
  } catch {
    return false;
  }
};

const getMatchedPatterns = (patterns: string[], text: string) => {
  return patterns.filter((pattern) => safePatternTest(pattern, text));
};

const getAllFactorMatches = (factorKey: string, patterns: string[], text: string) => {
  const baseMatches = getMatchedPatterns(patterns, text);
  const fallbackPatterns = FALLBACK_FACTOR_PATTERNS[factorKey] ?? [];
  const fallbackMatches = getMatchedPatterns(fallbackPatterns, text);
  return [...baseMatches, ...fallbackMatches];
};

const getTextNumber = (text: string) => {
  for (const [word, value] of Object.entries(TEXT_NUMBER_MAP)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
      return value;
    }
  }
  return null;
};

const regionMultiplierFor = (region: CarbonRegion, category: CarbonCategory) => {
  return REGION_MULTIPLIER[region][category] ?? 1;
};

const getQuantityFromText = (text: string, unit: string) => {
  const lower = text.toLowerCase();

  const km = lower.match(/(\d+(?:\.\d+)?)\s*(km|kilometer|kilometre|kms)/i);
  const grams = lower.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams)/i);
  const ml = lower.match(/(\d+(?:\.\d+)?)\s*(ml|milliliter|millilitre)/i);
  const hours = lower.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/i);
  const minutes = lower.match(/(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes)/i);
  const xCount = lower.match(/(?:x|times)\s*(\d+(?:\.\d+)?)/i);
  const count = lower.match(/(\d+(?:\.\d+)?)\s*(cup|cups|item|items|slice|slices|meal|meals|ride|rides|trip|trips|shot|shots|pack|packs|bottle|bottles)/i);
  const textCount = getTextNumber(lower);

  const inferCount = () => {
    if (count) return parseFloat(count[1]);
    if (xCount) return parseFloat(xCount[1]);
    if (textCount) return textCount;
    return 1;
  };

  if (unit.includes("per_passenger_km") || unit.includes("per_km")) {
    const defaultKm = lower.includes("commute") ? 15 : 10;
    return { quantity: km ? parseFloat(km[1]) : defaultKm, quantityHint: km ? "distance from input" : `default ${defaultKm} km` };
  }

  if (unit.includes("per_100g")) {
    const totalGrams = grams ? parseFloat(grams[1]) : 100;
    return { quantity: totalGrams / 100, quantityHint: grams ? "grams from input" : "default 100 g" };
  }

  if (unit.includes("per_100ml")) {
    const totalMl = ml ? parseFloat(ml[1]) : 100;
    return { quantity: totalMl / 100, quantityHint: ml ? "volume from input" : "default 100 ml" };
  }

  if (unit.includes("per_10g")) {
    const totalGrams = grams ? parseFloat(grams[1]) : 10;
    return { quantity: totalGrams / 10, quantityHint: grams ? "grams from input" : "default 10 g" };
  }

  if (unit.includes("per_10ml")) {
    const totalMl = ml ? parseFloat(ml[1]) : 10;
    return { quantity: totalMl / 10, quantityHint: ml ? "volume from input" : "default 10 ml" };
  }

  if (unit.includes("per_1hr")) {
    if (hours) {
      return { quantity: parseFloat(hours[1]), quantityHint: "hours from input" };
    }

    if (minutes) {
      return { quantity: parseFloat(minutes[1]) / 60, quantityHint: "minutes from input" };
    }

    return { quantity: 1, quantityHint: "default 1 hour" };
  }

  if (unit.includes("per_10min")) {
    if (minutes) {
      return { quantity: parseFloat(minutes[1]) / 10, quantityHint: "minutes from input" };
    }
    return { quantity: 1, quantityHint: "default 10 min" };
  }

  if (count) {
    return { quantity: parseFloat(count[1]), quantityHint: "count from input" };
  }

  if (unit.includes("per_item") || unit.includes("per_order") || unit.includes("per_pack") || unit.includes("per_person") || unit.includes("per_visit") || unit.includes("per_session") || unit.includes("per_meal") || unit.includes("per_cycle") || unit.includes("per_load") || unit.includes("per_day") || unit.includes("per_transaction") || unit.includes("per_package") || unit.includes("per_night")) {
    const guessed = inferCount();
    const inferred = guessed > 1;
    return { quantity: guessed, quantityHint: inferred ? "count from input" : "default quantity" };
  }

  return { quantity: 1, quantityHint: "default quantity" };
};

const resolveBrandMultiplier = (text: string, brands?: Record<string, { multiplier?: number }>) => {
  if (!brands) {
    return { multiplier: 1, matchedBrand: null as string | null };
  }

  const lower = text.toLowerCase();
  for (const [brandName, brandData] of Object.entries(brands)) {
    if (lower.includes(brandName.toLowerCase()) && typeof brandData.multiplier === "number") {
      return { multiplier: brandData.multiplier, matchedBrand: brandName };
    }
  }

  return { multiplier: 1, matchedBrand: null as string | null };
};

const confidenceFromSignals = (hasQuantity: boolean, hasBrand: boolean, co2: number): CarbonActivity["confidence"] => {
  let score = 0.45;
  if (hasQuantity) score += 0.2;
  if (hasBrand) score += 0.15;
  if (co2 > 1) score += 0.1;
  if (score >= 0.72) return "high";
  if (score >= 0.55) return "medium";
  return "low";
};

export const loadCarbonModel = async () => {
  if (!modelPromise) {
    modelPromise = fetch("/carbon_model.json").then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load carbon model artifact");
      }
      return (await response.json()) as RawModel;
    });
  }

  return modelPromise;
};

export const getCarbonRegion = (): CarbonRegion => {
  const stored = localStorage.getItem(REGION_STORAGE_KEY);
  return stored === "global" ? "global" : "india";
};

export const setCarbonRegion = (region: CarbonRegion) => {
  localStorage.setItem(REGION_STORAGE_KEY, region);
  window.dispatchEvent(new Event("eco-carbon-region-update"));
};

export const extractAllActivities = async (input: string, region: CarbonRegion = getCarbonRegion()): Promise<CarbonActivity[]> => {
  const model = await loadCarbonModel();
  const text = input.trim();
  const normalized = text.toLowerCase();

  const activities: CarbonActivity[] = [];
  const dedupe = new Set<string>();

  for (const [sourceCategory, categoryPatterns] of Object.entries(model.ner_patterns || {})) {
    const mappedCategory = categoryMap[sourceCategory];
    if (!mappedCategory) continue;

    const factorGroup = model.emission_graph[sourceCategory];
    if (!factorGroup) continue;

    for (const [factorKey, patterns] of Object.entries(categoryPatterns)) {
      const factor = factorGroup[factorKey];
      if (!factor) continue;

      const matchedPatterns = getAllFactorMatches(factorKey, patterns, normalized);
      if (matchedPatterns.length === 0) continue;
      if (dedupe.has(`${sourceCategory}:${factorKey}`)) continue;
      dedupe.add(`${sourceCategory}:${factorKey}`);

      const quantityUnit = factor.unit ?? (typeof factor.use_factor === "number" ? "kg_co2e_per_hour" : "kg_co2e_per_item");
      const { quantity, quantityHint } = getQuantityFromText(normalized, quantityUnit);
      const { multiplier, matchedBrand } = resolveBrandMultiplier(normalized, factor.brands);
      const regionMultiplier = regionMultiplierFor(region, mappedCategory);

      let base = 0;
      let co2 = 0;

      if (typeof factor.base_factor === "number") {
        base = factor.base_factor;
        co2 = factor.base_factor * quantity * multiplier;
      } else if (typeof factor.use_factor === "number") {
        base = factor.use_factor;
        co2 = factor.use_factor * quantity;
      } else if (typeof factor.purchase_kg === "number") {
        base = factor.purchase_kg;
        co2 = factor.purchase_kg;
      } else {
        continue;
      }

      const co2WithRegion = parseFloat((co2 * regionMultiplier).toFixed(3));
      const confidence = confidenceFromSignals(quantityHint.includes("input"), !!matchedBrand, co2);

      const labelSuffix = typeof factor.purchase_kg === "number" ? " (Purchase impact)" : "";

      activities.push({
        id: `${Date.now()}-${sourceCategory}-${factorKey}-${activities.length}`,
        sourceCategory,
        category: mappedCategory,
        factorKey,
        label: `${toTitle(factorKey)}${labelSuffix}`,
        quantity: parseFloat(quantity.toFixed(2)),
        unit: quantityUnit,
        baseFactor: base,
        brandMultiplier: multiplier,
        co2Kg: co2WithRegion,
        confidence,
        confidenceReason: matchedBrand
          ? `Matched ${matchedPatterns.length} pattern${matchedPatterns.length > 1 ? "s" : ""} + brand (${matchedBrand}), ${quantityHint}, region adjusted (${region}).`
          : `Matched ${matchedPatterns.length} pattern${matchedPatterns.length > 1 ? "s" : ""} with ${quantityHint}, region adjusted (${region}).`,
        why: `${toTitle(factorKey)} contributed significantly based on detected activity and model factors${region === "global" ? " with global profile adjustment" : ""}.`,
        alternate: fallbackAlternatives[mappedCategory],
      });
    }
  }

  return activities;
};

export const parseActivityText = async (input: string, region: CarbonRegion = getCarbonRegion()): Promise<CarbonAnalysisResult> => {
  const text = input.trim();
  const activities = await extractAllActivities(text, region);

  const totalKgCo2e = parseFloat(activities.reduce((sum, item) => sum + item.co2Kg, 0).toFixed(3));

  const categoryTotals: Record<CarbonCategory, number> = {
    transport: 0,
    food: 0,
    energy: 0,
    goods: 0,
  };

  for (const item of activities) {
    categoryTotals[item.category] = parseFloat((categoryTotals[item.category] + item.co2Kg).toFixed(3));
  }

  const uncertaintyKg = parseFloat((Math.max(0.1, totalKgCo2e * 0.18)).toFixed(3));
  const confidenceInterval: [number, number] = [
    parseFloat(Math.max(0, totalKgCo2e - uncertaintyKg).toFixed(3)),
    parseFloat((totalKgCo2e + uncertaintyKg).toFixed(3)),
  ];

  const summary = activities.length
    ? `Detected ${activities.length} activity pattern${activities.length > 1 ? "s" : ""} with total estimated impact ${totalKgCo2e} kg CO₂e.`
    : "No known carbon activity patterns were detected in this entry.";

  return {
    input: text,
    createdAt: new Date().toISOString(),
    region,
    totalKgCo2e,
    uncertaintyKg,
    confidenceInterval,
    categoryTotals,
    activities,
    summary,
  };
};

export const analyzeCarbonInput = async (input: string, region: CarbonRegion = getCarbonRegion()) => {
  return parseActivityText(input, region);
};
