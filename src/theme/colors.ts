// JS mirror of the Tailwind palette (tailwind.config.js). Use these where a
// raw color string is needed (SVG charts, navigation theme, status bar) and
// className strings where styling JSX.
export const colors = {
  bg: "#0F0F0F",
  surface: "#1A1A1A",
  surface2: "#242424",
  border: "#2E2E2E",
  accent: "#4CAF50",
  warn: "#FF6B35",
  danger: "#EF4444",
  textPrimary: "#F5F5F5",
  textSecondary: "#A3A3A3",
  textMuted: "#6B6B6B",
} as const;

/**
 * Ring/progress color by fraction of target consumed.
 * green < 80%, orange 80–100%, red > 100%.
 */
export function progressColor(fraction: number): string {
  if (fraction > 1) return colors.danger;
  if (fraction >= 0.8) return colors.warn;
  return colors.accent;
}
