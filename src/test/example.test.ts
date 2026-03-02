import { beforeAll, describe, it, expect, vi } from "vitest";
import { analyzeCarbonInput } from "@/lib/carbon/inference";

const mockedModel = {
  emission_graph: {
    transport: {
      car_petrol_sedan: {
        base_factor: 0.21,
        unit: "kg_co2e_per_km",
      },
    },
    food: {
      chicken_biryani: {
        base_factor: 1.8,
        unit: "kg_co2e_per_item",
      },
      milk_100ml: {
        base_factor: 0.15,
        unit: "kg_co2e_per_100ml",
      },
    },
  },
  ner_patterns: {
    transport: {
      car_petrol_sedan: ["drove?\\s+(?:my\\s+)?(?:car|sedan)"]
    },
    food: {
      chicken_biryani: ["chicken\\s+biryani"],
      milk_100ml: ["\\bmilk\\b"],
    },
  },
};

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockedModel,
    }),
  );
});

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("detects transport + chicken biryani from one voice log sentence", async () => {
    const analysis = await analyzeCarbonInput("I had chicken biryani for lunch and drove 10 km to office", "india");
    const labels = analysis.activities.map((item) => item.label.toLowerCase());

    expect(analysis.activities.length).toBeGreaterThanOrEqual(2);
    expect(labels.some((label) => label.includes("biryani"))).toBe(true);
    expect(labels.some((label) => label.includes("car") || label.includes("uber") || label.includes("bike"))).toBe(true);
    expect(analysis.categoryTotals.food).toBeGreaterThan(0);
  });

  it("detects two food items in one sentence including milk", async () => {
    const analysis = await analyzeCarbonInput("I had chicken biryani for lunch and a glass of milk", "india");
    const labels = analysis.activities.map((item) => item.label.toLowerCase());

    expect(analysis.activities.length).toBeGreaterThanOrEqual(2);
    expect(labels.some((label) => label.includes("chicken biryani"))).toBe(true);
    expect(labels.some((label) => label.includes("milk"))).toBe(true);
    expect(analysis.categoryTotals.food).toBeGreaterThan(0);
  });
});
