// Helpers for the "HH:MM" (24-hour) time strings used by meal reminders.

import { MealTimes, MealKey } from "@/types";

export const DEFAULT_MEAL_TIMES: MealTimes = {
  breakfast: "08:00",
  lunch: "12:30",
  dinner: "19:00",
};

export const MEAL_META: Record<MealKey, { label: string; emoji: string }> = {
  breakfast: { label: "Breakfast", emoji: "🍳" },
  lunch: { label: "Lunch", emoji: "🥗" },
  dinner: { label: "Dinner", emoji: "🍽️" },
};

/** "08:30" → { hour: 8, minute: 30 }. Falls back to midnight on bad input. */
export function parseHM(hm: string): { hour: number; minute: number } {
  const [h, m] = hm.split(":").map(Number);
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/** Build a canonical "HH:MM" string from parts. */
export function toHM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "13:05" → "1:05 PM" for display. */
export function formatHM(hm: string): string {
  const { hour, minute } = parseHM(hm);
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}
