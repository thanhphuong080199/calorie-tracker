import { MealEntry, Macros } from "@/types";

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Per100 {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

/**
 * Scale per-100g values to a concrete weight, producing the total
 * calories/macros for one component (or a whole single-item meal).
 */
export function scalePer100(p: Per100, grams: number): Nutrition {
  const factor = grams / 100;
  return {
    calories: round(p.caloriesPer100g * factor),
    protein: round1(p.proteinPer100g * factor),
    carbs: round1(p.carbsPer100g * factor),
    fat: round1(p.fatPer100g * factor),
  };
}

/** Sum a set of already-scaled component totals into a meal total. */
export function sumNutrition(rows: Nutrition[]): Nutrition {
  return rows.reduce<Nutrition>(
    (acc, r) => ({
      calories: round(acc.calories + r.calories),
      protein: round1(acc.protein + r.protein),
      carbs: round1(acc.carbs + r.carbs),
      fat: round1(acc.fat + r.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Sum calories across a day's meals. */
export function totalCalories(meals: MealEntry[]): number {
  return round(meals.reduce((sum, m) => sum + m.calories, 0));
}

/** Sum macros across a day's meals. */
export function totalMacros(meals: MealEntry[]): Macros {
  return meals.reduce<Macros>(
    (acc, m) => ({
      protein: round1(acc.protein + m.protein),
      carbs: round1(acc.carbs + m.carbs),
      fat: round1(acc.fat + m.fat),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
}

/** Per-component gram slider range. Components can be small (a splash of sauce)
 *  or large (a big bowl of rice), so the range is wider than a single serving. */
export const ITEM_GRAM_MIN = 0;
export const ITEM_GRAM_MAX = 1000;
export function clampGrams(g: number): number {
  return Math.min(ITEM_GRAM_MAX, Math.max(ITEM_GRAM_MIN, Math.round(g)));
}
