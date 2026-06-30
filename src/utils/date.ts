// All date keys are local-time YYYY-MM-DD strings so a "day" matches the
// user's wall clock, not UTC.

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Shift a YYYY-MM-DD key by `days` (can be negative). */
export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function isToday(key: string): boolean {
  return key === today();
}

export function isFuture(key: string): boolean {
  return key > today();
}

/** Short human label for the date navigator: "Today", "Yesterday", or "Mon, Jun 30". */
export function formatDateLabel(key: string): string {
  if (key === today()) return "Today";
  if (key === addDays(today(), -1)) return "Yesterday";
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "8:15 AM" from an ISO timestamp. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Consecutive days (ending today or yesterday) that have at least one meal.
 * Counting from yesterday keeps the streak alive before the first meal of today.
 */
export function computeStreak(loggedDates: Set<string>): number {
  let streak = 0;
  let cursor = today();
  // If nothing logged today yet, start counting from yesterday.
  if (!loggedDates.has(cursor)) cursor = addDays(cursor, -1);
  while (loggedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
