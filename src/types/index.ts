export type Source = "openfoodfacts" | "gemini_estimate";
export type Confidence = "high" | "medium" | "low";

/** One persisted component of a meal. Nutrition values are TOTALS for `grams`. */
export interface MealItem {
  name: string;
  grams: number;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  source: Source;
}

/**
 * A single logged meal. Top-level nutrition values are TOTALS (the sum of the
 * components, or the whole meal if there's no breakdown). `items` carries the
 * per-component breakdown when the meal was recognized from a photo.
 */
export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  servingG: number; // total weight (sum of item grams)
  source: Source;
  timestamp: string; // ISO 8601
  imageUri?: string;
  items?: MealItem[];
}

/** All meals for one calendar day. */
export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealEntry[];
  calorieTarget: number; // snapshot of the target when the day was first logged
}

export interface UserSettings {
  dailyCalorieTarget: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}

/**
 * One identified component of a meal, expressed per-100g plus an estimated
 * weight, so the UI can rescale it live as the user edits the grams.
 */
export interface RecognitionItem {
  name: string;
  grams: number; // estimated grams of this component as shown
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: Source; // where the per-100g nutrition came from
}

/**
 * Result of the recognition pipeline (Gemini → Open Food Facts). A meal is a
 * set of components; the UI lets the user tweak each component's grams, then
 * sums them for the meal total. Not persisted.
 */
export interface RecognitionResult {
  name: string; // overall meal name, e.g. "Rice with fried chicken & egg"
  items: RecognitionItem[];
  confidence: Confidence;
}

/** Macro triple, reused across summaries and scaling helpers. */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}
