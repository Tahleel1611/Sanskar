import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { CarbonAnalysisResult, CarbonActivity, CarbonCategory } from "./inference";

const HISTORY_KEY = "eco_carbon_lens_history";
const LATEST_KEY = "eco_carbon_lens_latest";
const SYNC_QUEUE_KEY = "eco_carbon_lens_sync_queue";
const MAX_HISTORY = 40;

const mapCategoryToDb = (category: CarbonCategory) => {
  if (category === "goods") return "consumption";
  return category;
};

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getLatestCarbonAnalysis = () => safeParse<CarbonAnalysisResult>(localStorage.getItem(LATEST_KEY));

export const getCarbonAnalysisHistory = () => {
  const history = safeParse<CarbonAnalysisResult[]>(localStorage.getItem(HISTORY_KEY));
  return history ?? [];
};

const getSyncQueue = () => {
  const queue = safeParse<CarbonAnalysisResult[]>(localStorage.getItem(SYNC_QUEUE_KEY));
  return queue ?? [];
};

const setSyncQueue = (queue: CarbonAnalysisResult[]) => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue.slice(0, MAX_HISTORY)));
};

export const getPendingCarbonSyncCount = () => getSyncQueue().length;

export const saveCarbonAnalysis = async (result: CarbonAnalysisResult) => {
  localStorage.setItem(LATEST_KEY, JSON.stringify(result));

  const history = getCarbonAnalysisHistory();
  const nextHistory = [result, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));

  window.dispatchEvent(new Event("eco-carbon-analysis-update"));

  await flushQueuedCarbonSyncs();
  const synced = await syncAnalysisToSupabase(result);
  if (!synced) {
    setSyncQueue([result, ...getSyncQueue()]);
  }
};

const mapActivityToInsert = (activity: CarbonActivity, userId: string): TablesInsert<"activities"> => ({
  user_id: userId,
  activity_type: activity.factorKey,
  category: mapCategoryToDb(activity.category),
  co2_kg: activity.co2Kg,
  confidence: activity.confidence,
  confidence_reason: activity.confidenceReason,
  description: activity.label,
  distance_km: activity.unit.includes("km") ? activity.quantity : null,
  is_confirmed: activity.confidence === "high",
});

const syncAnalysisToSupabase = async (result: CarbonAnalysisResult) => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId || result.activities.length === 0) {
      return true;
    }

    const rows = result.activities.map((activity) => mapActivityToInsert(activity, userId));
    const { error } = await supabase.from("activities").insert(rows);

    if (error) {
      console.warn("Carbon analysis sync failed", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Carbon analysis sync skipped", error);
    return false;
  }
};

const flushQueuedCarbonSyncs = async () => {
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const remaining: CarbonAnalysisResult[] = [];
  for (const item of queue.slice().reverse()) {
    const synced = await syncAnalysisToSupabase(item);
    if (!synced) {
      remaining.unshift(item);
    }
  }

  setSyncQueue(remaining);
};

window.addEventListener("online", () => {
  void flushQueuedCarbonSyncs();
});
