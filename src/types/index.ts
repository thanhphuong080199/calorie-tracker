export type Source = "openfoodfacts" | "gemini_estimate" | "manual";
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

export type Sex = "male" | "female" | "unspecified";

/** Activity multiplier buckets for the TDEE estimate (Mifflin-St Jeor). */
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

/** The user's headline goal. Drives the calorie deficit/surplus. */
export type MainGoal =
  | "lose_weight"
  | "gain_muscle"
  | "maintain"
  | "boost_energy"
  | "improve_nutrition"
  | "gain_weight";

/** Eating style. Drives the macro split (carbs/protein/fat ratios). */
export type DietType =
  | "balanced"
  | "high_protein"
  | "low_carb"
  | "vegetarian"
  | "vegan"
  | "keto"
  | "mediterranean";

/** The inputs the TDEE estimate is built from. `bodyFatPct` is optional — when
 *  present we use the (more accurate) Katch-McArdle formula. */
export interface TdeeProfile {
  name?: string;
  sex: Sex;
  age: number; // years
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  bodyFatPct?: number; // 0–100, optional
  activityLevel: ActivityLevel;
  goals: MainGoal[]; // one or more; their calorie adjustments are averaged
  dietType: DietType;
}

/** Local time-of-day for each meal, as "HH:MM" (24-hour). Drives reminders. */
export interface MealTimes {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export type MealKey = keyof MealTimes;

export interface UserSettings {
  dailyCalorieTarget: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  /** Set once the user completes the TDEE onboarding; gates first-launch flow. */
  onboarded?: boolean;
  /** The profile the current targets were derived from, so it can be edited. */
  profile?: TdeeProfile;
  /** When the user usually eats — the schedule for daily meal reminders. */
  mealTimes?: MealTimes;
  /** Master switch for local meal/streak reminder notifications. */
  remindersEnabled?: boolean;
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
