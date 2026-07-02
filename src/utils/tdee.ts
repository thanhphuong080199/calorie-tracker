import {
  ActivityLevel,
  DietType,
  MainGoal,
  Sex,
  TdeeProfile,
} from "@/types";

/**
 * TDEE / calorie-target math. All pure functions so they can be unit-tested and
 * reused live in the onboarding preview.
 *
 * BMR uses Mifflin-St Jeor (the modern default), or Katch-McArdle when the user
 * knows their body-fat % — Katch-McArdle is driven by lean mass so it's more
 * accurate for lean or heavy builds where Mifflin over/under-shoots.
 *
 * The calorie target = maintenance TDEE + a per-goal adjustment. The macro split
 * is chosen by diet type (a keto plan and a balanced plan divide the same
 * calories very differently).
 */

/** Standard activity multipliers applied to BMR to get maintenance TDEE. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_ORDER: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

export const ACTIVITY_LABELS: Record<
  ActivityLevel,
  { title: string; emoji: string }
> = {
  sedentary: { title: "Sedentary", emoji: "🚗" },
  light: { title: "Lightly Active", emoji: "🚶" },
  moderate: { title: "Moderately Active", emoji: "🏃" },
  active: { title: "Very Active", emoji: "🤸" },
  very_active: { title: "Super Active", emoji: "💪" },
};

export const GOAL_ORDER: MainGoal[] = [
  "lose_weight",
  "gain_muscle",
  "maintain",
  "boost_energy",
  "improve_nutrition",
  "gain_weight",
];

export const GOAL_LABELS: Record<MainGoal, { title: string; emoji: string }> = {
  lose_weight: { title: "Lose Weight", emoji: "🔥" },
  gain_muscle: { title: "Gain Muscle", emoji: "💪" },
  maintain: { title: "Maintain Weight", emoji: "⚖️" },
  boost_energy: { title: "Boost Energy", emoji: "⚡" },
  improve_nutrition: { title: "Improve Nutrition", emoji: "🥗" },
  gain_weight: { title: "Gain Weight", emoji: "🍚" },
};

/** kcal/day adjustment applied to maintenance TDEE per goal. */
export const GOAL_ADJUSTMENT: Record<MainGoal, number> = {
  lose_weight: -500, // ~0.5 kg/week deficit
  gain_muscle: +250, // lean surplus for muscle gain
  maintain: 0,
  boost_energy: 0,
  improve_nutrition: 0,
  gain_weight: +400,
};

export const DIET_ORDER: DietType[] = [
  "balanced",
  "high_protein",
  "low_carb",
  "vegetarian",
  "vegan",
  "keto",
  "mediterranean",
];

export const DIET_LABELS: Record<DietType, { title: string; emoji: string }> = {
  balanced: { title: "Balanced Diet", emoji: "🥑" },
  high_protein: { title: "High Protein", emoji: "🍗" },
  low_carb: { title: "Low Carb", emoji: "🥩" },
  vegetarian: { title: "Vegetarian", emoji: "🥕" },
  vegan: { title: "Vegan", emoji: "🌱" },
  keto: { title: "Keto", emoji: "🥓" },
  mediterranean: { title: "Mediterranean", emoji: "🍅" },
};

/** Macro split per diet as {carbs, protein, fat} fractions (sum to 1). */
export const DIET_MACROS: Record<
  DietType,
  { carbs: number; protein: number; fat: number }
> = {
  balanced: { carbs: 0.4, protein: 0.3, fat: 0.3 },
  high_protein: { carbs: 0.35, protein: 0.4, fat: 0.25 },
  low_carb: { carbs: 0.25, protein: 0.4, fat: 0.35 },
  vegetarian: { carbs: 0.45, protein: 0.25, fat: 0.3 },
  vegan: { carbs: 0.5, protein: 0.2, fat: 0.3 },
  keto: { carbs: 0.05, protein: 0.25, fat: 0.7 },
  mediterranean: { carbs: 0.45, protein: 0.2, fat: 0.35 },
};

/** Never suggest below this — a floor guards against unsafe/silly targets. */
const MIN_CALORIES = 1200;

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Basal metabolic rate in kcal/day. */
export function bmr(
  sex: Sex,
  age: number,
  heightCm: number,
  weightKg: number,
  bodyFatPct?: number,
): number {
  if (bodyFatPct != null && bodyFatPct > 0 && bodyFatPct < 100) {
    // Katch-McArdle: driven by lean body mass, ignores sex/height/age.
    const leanMass = weightKg * (1 - bodyFatPct / 100);
    return 370 + 21.6 * leanMass;
  }
  // Mifflin-St Jeor. For an unspecified sex we average the male (+5) and
  // female (−161) constants (−78).
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const sexConstant = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  return base + sexConstant;
}

/** Maintenance calories: BMR × activity factor. */
export function tdee(p: TdeeProfile): number {
  return (
    bmr(p.sex, p.age, p.heightCm, p.weightKg, p.bodyFatPct) *
    ACTIVITY_FACTORS[p.activityLevel]
  );
}

/**
 * Combined kcal/day adjustment for a set of goals: the average of each goal's
 * adjustment. Averaging (not summing) keeps opposing picks sane — e.g. "lose
 * weight" (−500) + "gain muscle" (+250) → a mild −125 recomposition deficit,
 * rather than a contradictory −250. Empty set = maintenance (0).
 */
export function goalAdjustment(goals: MainGoal[]): number {
  if (goals.length === 0) return 0;
  const sum = goals.reduce((s, g) => s + GOAL_ADJUSTMENT[g], 0);
  return sum / goals.length;
}

/** Suggested daily calorie target for the profile's goals, floored & rounded. */
export function calorieTarget(p: TdeeProfile): number {
  const raw = tdee(p) + goalAdjustment(p.goals);
  return round10(Math.max(MIN_CALORIES, raw));
}

export interface MacroTargets {
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

/**
 * Split a calorie target into macro grams using the diet's carb/protein/fat
 * energy ratios (4 kcal/g for protein & carbs, 9 kcal/g for fat).
 */
export function macroTargets(
  calories: number,
  diet: DietType,
): MacroTargets {
  const r = DIET_MACROS[diet];
  return {
    carbsTarget: Math.round((calories * r.carbs) / 4),
    proteinTarget: Math.round((calories * r.protein) / 4),
    fatTarget: Math.round((calories * r.fat) / 9),
  };
}
