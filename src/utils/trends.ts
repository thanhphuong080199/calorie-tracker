// Aggregation for the Insights / trends view. Pure functions over the persisted
// logs, so they're easy to reason about and test. A "period" is a Weekly,
// Monthly or Yearly window sliced into a handful of buckets (days / weeks /
// months). Every bucket reports its *average daily calories* so the dashed
// daily-goal line is comparable across all three ranges.

import { DailyLog } from "@/types";
import { toDateKey, parseDateKey, addDays, today } from "@/utils/date";
import { totalCalories, totalMacros } from "@/utils/nutrition";

export type TrendRange = "week" | "month" | "year";

export interface TrendBucket {
  key: string; // stable id (a date key)
  label: string; // x-axis label ("17", "W1", "Jan")
  start: string; // first date key in the bucket
  loggedDays: number; // days in the bucket with at least one meal
  /** Average kcal across the bucket's *logged* days (0 when nothing logged). */
  value: number;
  // Macro totals across the bucket (grams), for the stacked % chart.
  protein: number;
  carbs: number;
  fat: number;
}

export interface TrendPeriod {
  range: TrendRange;
  label: string; // header label ("Dec 16 - Dec 22, 2024")
  anchor: string; // a date key inside the period
  buckets: TrendBucket[];
  goal: number; // daily calorie target — the dashed goal line
  /** Average kcal across every logged day in the whole period. */
  avgCalories: number;
  loggedDays: number;
}

const round = (n: number) => Math.round(n);

/** Monday-based start of the week containing `key`. */
export function startOfWeek(key: string): string {
  const dow = parseDateKey(key).getDay(); // 0 Sun … 6 Sat
  return addDays(key, -((dow + 6) % 7));
}

/** First day of the month containing `key`. */
function startOfMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, 1));
}

function monthShort(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { month: "short" });
}

/** Sum one day's meals into a bucket accumulator. */
function accumulate(bucket: TrendBucket, log: DailyLog | undefined) {
  if (!log || log.meals.length === 0) return;
  const macros = totalMacros(log.meals);
  bucket.value += totalCalories(log.meals); // running total; averaged at the end
  bucket.protein += macros.protein;
  bucket.carbs += macros.carbs;
  bucket.fat += macros.fat;
  bucket.loggedDays += 1;
}

/** Turn the running calorie *total* into an average over logged days. */
function finalize(bucket: TrendBucket): TrendBucket {
  bucket.value = bucket.loggedDays > 0 ? round(bucket.value / bucket.loggedDays) : 0;
  bucket.protein = round(bucket.protein);
  bucket.carbs = round(bucket.carbs);
  bucket.fat = round(bucket.fat);
  return bucket;
}

function emptyBucket(key: string, label: string, start: string): TrendBucket {
  return { key, label, start, loggedDays: 0, value: 0, protein: 0, carbs: 0, fat: 0 };
}

/** 7 daily buckets, Monday → Sunday, for the week containing `anchor`. */
function weekBuckets(anchor: string, logs: Record<string, DailyLog>): TrendBucket[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const b = emptyBucket(day, String(parseDateKey(day).getDate()), day);
    accumulate(b, logs[day]);
    return finalize(b);
  });
}

/** Weekly buckets (W1–W5) within the month containing `anchor`. */
function monthBuckets(anchor: string, logs: Record<string, DailyLog>): TrendBucket[] {
  const first = startOfMonth(anchor);
  const [y, m] = first.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  const buckets = Array.from({ length: weekCount }, (_, i) =>
    emptyBucket(`${first}-w${i}`, `W${i + 1}`, addDays(first, i * 7)),
  );
  for (let d = 1; d <= daysInMonth; d++) {
    const day = toDateKey(new Date(y, m - 1, d));
    accumulate(buckets[Math.floor((d - 1) / 7)], logs[day]);
  }
  return buckets.map(finalize);
}

/** 12 monthly buckets (Jan–Dec) for the year containing `anchor`. */
function yearBuckets(anchor: string, logs: Record<string, DailyLog>): TrendBucket[] {
  const year = parseDateKey(anchor).getFullYear();
  const buckets = Array.from({ length: 12 }, (_, mo) => {
    const start = toDateKey(new Date(year, mo, 1));
    return emptyBucket(start, monthShort(start), start);
  });
  Object.keys(logs).forEach((day) => {
    const d = parseDateKey(day);
    if (d.getFullYear() === year) accumulate(buckets[d.getMonth()], logs[day]);
  });
  return buckets.map(finalize);
}

/** Header label for the current period. */
function periodLabel(range: TrendRange, anchor: string): string {
  if (range === "year") return String(parseDateKey(anchor).getFullYear());
  if (range === "month") {
    return parseDateKey(anchor).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  const year = parseDateKey(end).getFullYear();
  return `${monthShort(start)} ${parseDateKey(start).getDate()} - ${monthShort(end)} ${parseDateKey(end).getDate()}, ${year}`;
}

/** Shift the anchor to the previous/next period. */
export function shiftPeriod(range: TrendRange, anchor: string, dir: 1 | -1): string {
  if (range === "week") return addDays(startOfWeek(anchor), dir * 7);
  const d = parseDateKey(anchor);
  if (range === "month") return toDateKey(new Date(d.getFullYear(), d.getMonth() + dir, 1));
  return toDateKey(new Date(d.getFullYear() + dir, 0, 1));
}

/** True when the next period would start in the future (can't navigate there). */
export function isFuturePeriod(range: TrendRange, anchor: string): boolean {
  return shiftPeriod(range, anchor, 1) > today();
}

/** Build the whole period model the Insights screen renders. */
export function buildPeriod(
  range: TrendRange,
  anchor: string,
  logs: Record<string, DailyLog>,
  goal: number,
): TrendPeriod {
  const buckets =
    range === "week"
      ? weekBuckets(anchor, logs)
      : range === "month"
        ? monthBuckets(anchor, logs)
        : yearBuckets(anchor, logs);

  const logged = buckets.reduce((s, b) => s + b.loggedDays, 0);
  // Weight each bucket's average by its logged days to get the period average.
  const totalCals = buckets.reduce((s, b) => s + b.value * b.loggedDays, 0);

  return {
    range,
    anchor,
    label: periodLabel(range, anchor),
    buckets,
    goal,
    loggedDays: logged,
    avgCalories: logged > 0 ? round(totalCals / logged) : 0,
  };
}
