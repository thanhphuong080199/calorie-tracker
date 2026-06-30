import Constants from "expo-constants";
import { Confidence } from "@/types";

// gemini-2.5-flash is the current free-tier vision model. (gemini-2.0-flash had
// its free tier removed — it returns 429 "limit: 0" on the first call.) Swap
// this for another flash model if quotas change; the request shape is the same.
const MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 25000;

/** One food component Gemini broke the photo into, with per-100g nutrition. */
export interface GeminiItem {
  name: string;
  estimatedGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface GeminiMeal {
  name: string;
  confidence: Confidence;
  items: GeminiItem[];
}

/** Read the key injected via app.config.ts `extra` (see that file for why). */
export function getGeminiApiKey(): string {
  const extra = Constants.expoConfig?.extra as
    | { geminiApiKey?: string }
    | undefined;
  return extra?.geminiApiKey ?? "";
}

export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey().trim().length > 0;
}

const PROMPT = [
  "You are a nutrition expert. Look at this meal photo and break it into its distinct food components.",
  "For example a home-cooked bowl might be rice, fried chicken, and fried egg — return each as a separate component.",
  "For EACH component provide: a short food name, the estimated weight in grams of that component as shown in the photo, and its nutrition per 100 grams (calories, protein, carbs, fat).",
  "Return 1 component for a simple single food, up to 8 for a complex plate.",
  "Also give a short overall name for the whole meal and an overall confidence:",
  "'high' if clearly identifiable, 'medium' if plausible but ambiguous, 'low' if guessing.",
  "Use realistic values; never return zeros for a real food.",
].join(" ");

// Gemini's structured-output schema (OpenAPI subset). Forces clean JSON back.
const ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    estimatedGrams: { type: "NUMBER" },
    caloriesPer100g: { type: "NUMBER" },
    proteinPer100g: { type: "NUMBER" },
    carbsPer100g: { type: "NUMBER" },
    fatPer100g: { type: "NUMBER" },
  },
  required: [
    "name",
    "estimatedGrams",
    "caloriesPer100g",
    "proteinPer100g",
    "carbsPer100g",
    "fatPer100g",
  ],
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    mealName: { type: "STRING" },
    confidence: { type: "STRING", enum: ["high", "medium", "low"] },
    items: { type: "ARRAY", items: ITEM_SCHEMA },
  },
  required: ["mealName", "confidence", "items"],
};

const nonNeg = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Pull RetryInfo.retryDelay (e.g. "27s") out of a Gemini 429 body so we know
 * how long to wait. Returns 0 if it isn't present.
 */
function retryDelaySeconds(body: string): number {
  try {
    const json = JSON.parse(body) as {
      error?: { details?: { retryDelay?: string }[] };
    };
    for (const d of json.error?.details ?? []) {
      if (typeof d.retryDelay === "string") {
        const m = d.retryDelay.match(/(\d+(?:\.\d+)?)s/);
        if (m) return Math.ceil(Number(m[1]));
      }
    }
  } catch {
    // non-JSON body — fall through
  }
  return 0;
}

/**
 * Send a base64 image to Gemini Vision and get back the meal broken into food
 * components, each with per-100g nutrition. Throws on network / API / parse
 * failure so the caller can show a friendly error.
 */
export async function identifyMeal(
  base64: string,
  mimeType: string = "image/jpeg",
): Promise<GeminiMeal> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(
      "Missing Gemini API key. Add GEMINI_API_KEY to your .env and restart.",
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      // Disable 2.5-flash "thinking" — unneeded for this structured task, and
      // it keeps latency and token use (free-tier limits) down.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  // Free-tier 429s usually clear within seconds; Gemini tells us how long to
  // wait via RetryInfo, so auto-retry short waits before giving up.
  const MAX_ATTEMPTS = 3;
  const MAX_AUTO_WAIT_S = 20;

  let res: Response | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("Recognition timed out. Check your connection.");
      }
      throw new Error("Couldn't reach Gemini. Check your connection.");
    }
    clearTimeout(timer);

    if (res.ok) break;

    const detail = await res.text().catch(() => "");
    if (res.status === 400 || res.status === 403) {
      throw new Error("Gemini rejected the request — verify your API key.");
    }
    if (res.status === 429) {
      const waitS = retryDelaySeconds(detail);
      if (attempt < MAX_ATTEMPTS && waitS <= MAX_AUTO_WAIT_S) {
        await sleep((waitS || 2) * 1000);
        continue;
      }
      throw new Error(
        waitS > 0
          ? `Gemini's free-tier limit is busy. Try again in ~${waitS}s.`
          : "Gemini's free-tier limit reached. Wait a minute and try again.",
      );
    }
    throw new Error(
      `Gemini error ${res.status}${detail ? `: ${detail.slice(0, 120)}` : ""}`,
    );
  }

  if (!res || !res.ok) {
    throw new Error("Gemini's free-tier limit reached. Try again shortly.");
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  if (json.promptFeedback?.blockReason) {
    throw new Error("Gemini couldn't analyze this image. Try another photo.");
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no result. Try another photo.");
  }

  let parsed: {
    mealName?: unknown;
    confidence?: unknown;
    items?: unknown;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Couldn't read Gemini's response. Try again.");
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items: GeminiItem[] = rawItems
    .map((raw): GeminiItem | null => {
      const it = raw as Record<string, unknown>;
      const name = String(it.name ?? "").trim();
      if (!name) return null;
      return {
        name,
        estimatedGrams: nonNeg(it.estimatedGrams) || 100,
        caloriesPer100g: nonNeg(it.caloriesPer100g),
        proteinPer100g: nonNeg(it.proteinPer100g),
        carbsPer100g: nonNeg(it.carbsPer100g),
        fatPer100g: nonNeg(it.fatPer100g),
      };
    })
    .filter((it): it is GeminiItem => it !== null);

  if (items.length === 0) {
    throw new Error("Couldn't identify any food. Try another photo.");
  }

  const mealName = String(parsed.mealName ?? "").trim();
  return {
    name: mealName || items.map((i) => i.name).join(", ") || "Meal",
    confidence:
      parsed.confidence === "high" || parsed.confidence === "low"
        ? parsed.confidence
        : "medium",
    items,
  };
}
