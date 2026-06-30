// Open Food Facts free nutrition lookup. No key required, but the project
// asks clients to send an identifying User-Agent.
const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const USER_AGENT = "CalorieTracker/1.0 (Expo app; calorie-tracker)";
const REQUEST_TIMEOUT_MS = 12000;

export interface OffResult {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface OffNutriments {
  "energy-kcal_100g"?: number;
  energy_100g?: number; // kJ fallback
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffProduct {
  product_name?: string;
  nutriments?: OffNutriments;
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** kcal per 100g, converting from kJ if that's all the product has. */
function caloriesOf(n: OffNutriments): number {
  if (n["energy-kcal_100g"] != null) return num(n["energy-kcal_100g"]);
  if (n.energy_100g != null) return Math.round(num(n.energy_100g) / 4.184);
  return 0;
}

/**
 * Look up per-100g nutrition for a food name. Returns the first product that
 * has usable calorie data, or null if nothing suitable is found / on error.
 */
export async function lookupNutrition(name: string): Promise<OffResult | null> {
  const q = name.trim();
  if (!q) return null;

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "10",
    fields: "product_name,nutriments",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return null; // Network issues here are non-fatal; caller falls back.
  }
  clearTimeout(timer);

  if (!res.ok) return null;

  let data: { products?: OffProduct[] };
  try {
    data = (await res.json()) as { products?: OffProduct[] };
  } catch {
    return null;
  }

  const products = data.products ?? [];
  for (const p of products) {
    const n = p.nutriments;
    if (!n) continue;
    const calories = caloriesOf(n);
    if (calories <= 0) continue; // skip products with no energy data
    return {
      name: (p.product_name ?? q).trim() || q,
      caloriesPer100g: calories,
      proteinPer100g: num(n.proteins_100g),
      carbsPer100g: num(n.carbohydrates_100g),
      fatPer100g: num(n.fat_100g),
    };
  }
  return null;
}
