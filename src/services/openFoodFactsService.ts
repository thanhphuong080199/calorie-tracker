// Open Food Facts free nutrition lookup. No key required, but the project
// asks clients to send an identifying User-Agent.
//
// Two endpoints, because they're good at different things:
// - legacy CGI search.pl: used by the recognition pipeline's per-item lookup.
// - search-a-licious (search.openfoodfacts.org): proper full-text relevance,
//   far more reliable under load — used for the interactive food-search picker.
const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const SALICIOUS_URL = "https://search.openfoodfacts.org/search";
const USER_AGENT = "CalorieTracker/1.0 (Expo app; calorie-tracker)";
const REQUEST_TIMEOUT_MS = 12000;

export interface OffResult {
  name: string;
  brand?: string;
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
  // search.pl returns a comma string; search-a-licious returns an array.
  brands?: string | string[];
  nutriments?: OffNutriments;
}

/** First brand, from either the CGI (comma string) or salicious (array) shape. */
function firstBrand(brands: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(brands) ? brands[0] : brands;
  return raw?.split(",")[0]?.trim() || undefined;
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

/** Fetch raw products for a query, or null on any network/parse failure. */
async function fetchProducts(
  q: string,
  pageSize: number,
  signal?: AbortSignal,
): Promise<OffProduct[] | null> {
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(pageSize),
    fields: "product_name,brands,nutriments",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Abort our request if the caller aborts theirs (e.g. a superseded search).
  signal?.addEventListener("abort", () => controller.abort());

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
  try {
    const data = (await res.json()) as { products?: OffProduct[] };
    return data.products ?? [];
  } catch {
    return null;
  }
}

/** Map a product to a result, or null if it has no usable energy data. */
function toResult(p: OffProduct, fallbackName: string): OffResult | null {
  const n = p.nutriments;
  if (!n) return null;
  const calories = caloriesOf(n);
  if (calories <= 0) return null; // skip products with no energy data
  return {
    name: (p.product_name ?? fallbackName).trim() || fallbackName,
    brand: firstBrand(p.brands),
    caloriesPer100g: calories,
    proteinPer100g: num(n.proteins_100g),
    carbsPer100g: num(n.carbohydrates_100g),
    fatPer100g: num(n.fat_100g),
  };
}

/**
 * Look up per-100g nutrition for a food name. Returns the first product that
 * has usable calorie data, or null if nothing suitable is found / on error.
 */
export async function lookupNutrition(name: string): Promise<OffResult | null> {
  const q = name.trim();
  if (!q) return null;
  const products = await fetchProducts(q, 10);
  if (!products) return null;
  for (const p of products) {
    const result = toResult(p, q);
    if (result) return result;
  }
  return null;
}

/**
 * Search foods by name for the manual-add picker, via search-a-licious (proper
 * full-text relevance). Returns up to `limit` products that have usable calorie
 * data (empty array on miss/error). Pass a `signal` to cancel a stale search.
 */
export async function searchFoods(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<OffResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // No `fields` filter: restricting fields makes salicious drop `nutriments`.
  const params = new URLSearchParams({
    q,
    page_size: String(limit + 15),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());

  let res: Response;
  try {
    res = await fetch(`${SALICIOUS_URL}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
  clearTimeout(timer);
  if (!res.ok) return [];

  let hits: OffProduct[];
  try {
    const data = (await res.json()) as { hits?: OffProduct[] };
    hits = data.hits ?? [];
  } catch {
    return [];
  }

  const results: OffResult[] = [];
  for (const p of hits) {
    const result = toResult(p, q);
    if (result) results.push(result);
    if (results.length >= limit) break;
  }
  return results;
}
