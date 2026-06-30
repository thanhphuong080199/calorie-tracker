import { RecognitionResult, RecognitionItem } from "@/types";
import { identifyMeal } from "./geminiService";
import { lookupNutrition } from "./openFoodFactsService";
import { clampGrams } from "@/utils/nutrition";

/**
 * Full recognition pipeline:
 *   1. Gemini Vision breaks the photo into food components (name + estimated
 *      grams + per-100g nutrition each).
 *   2. Each component is looked up on Open Food Facts by name, in parallel.
 *   3. Per component, if OFF has a usable match its nutrition wins
 *      (source = openfoodfacts); otherwise Gemini's estimate is kept
 *      (source = gemini_estimate).
 *
 * The UI then sums the components for the meal total. Throws only if Gemini
 * itself fails; OFF misses are non-fatal.
 */
export async function recognizeMeal(
  base64: string,
  mimeType: string = "image/jpeg",
): Promise<RecognitionResult> {
  const meal = await identifyMeal(base64, mimeType);

  const items: RecognitionItem[] = await Promise.all(
    meal.items.map(async (it): Promise<RecognitionItem> => {
      const grams = clampGrams(it.estimatedGrams);
      const off = await lookupNutrition(it.name).catch(() => null);

      if (off && off.caloriesPer100g > 0) {
        return {
          name: it.name,
          grams,
          caloriesPer100g: off.caloriesPer100g,
          proteinPer100g: off.proteinPer100g,
          carbsPer100g: off.carbsPer100g,
          fatPer100g: off.fatPer100g,
          source: "openfoodfacts",
        };
      }

      return {
        name: it.name,
        grams,
        caloriesPer100g: it.caloriesPer100g,
        proteinPer100g: it.proteinPer100g,
        carbsPer100g: it.carbsPer100g,
        fatPer100g: it.fatPer100g,
        source: "gemini_estimate",
      };
    }),
  );

  return { name: meal.name, items, confidence: meal.confidence };
}
