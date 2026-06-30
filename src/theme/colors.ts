// JS mirror of the Tailwind palette (tailwind.config.js). Use these where a
// raw color string is needed (SVG charts, navigation theme, status bar) and
// className strings where styling JSX.
//
// Light theme: soft off-white canvas, white cards, a fresh lime-green accent,
// near-black text. Food photos and the calorie ring carry the color.
export const colors = {
  bg: "#F5F7F1", // app background — soft warm off-white
  surface: "#FFFFFF", // cards
  surface2: "#EEF1E8", // elevated / inputs / progress tracks
  border: "#E3E7DC",
  accent: "#7CC242", // fresh lime green — progress / positive (used as a fill)
  onAccent: "#16210B", // text/icons sitting on an accent fill (dark)
  warn: "#F5A623", // amber — near limit
  danger: "#E5484D", // red — over limit
  textPrimary: "#1E241A", // near-black, warm
  textSecondary: "#667063",
  textMuted: "#98A08F",
} as const;

/**
 * Ring/progress color by fraction of target consumed.
 * green < 80%, amber 80–100%, red > 100%.
 */
export function progressColor(fraction: number): string {
  if (fraction > 1) return colors.danger;
  if (fraction >= 0.8) return colors.warn;
  return colors.accent;
}

export type ProgressStatus = "on_track" | "near_limit" | "over";

/** Non-color label for the consumed fraction, so state isn't conveyed by hue alone. */
export function progressStatus(fraction: number): ProgressStatus {
  if (fraction > 1) return "over";
  if (fraction >= 0.8) return "near_limit";
  return "on_track";
}

export const PROGRESS_LABEL: Record<ProgressStatus, string> = {
  on_track: "On track",
  near_limit: "Near limit",
  over: "Over",
};
