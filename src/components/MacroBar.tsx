import React from "react";
import { View, Text } from "react-native";
import { Macros } from "@/types";

// Distinct chart colors for the three macros (not part of the core theme).
export const MACRO_COLORS = {
  protein: "#42A5F5", // blue
  carbs: "#FFB74D", // amber
  fat: "#BA68C8", // purple
} as const;

interface Props {
  macros: Macros;
  targets?: { protein?: number; carbs?: number; fat?: number };
}

const CAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/**
 * Stacked composition bar (by calorie contribution) plus per-macro gram
 * readouts. Targets, when set, are shown as "Xg / Yg".
 */
export default function MacroBar({ macros, targets }: Props) {
  const cals = {
    protein: macros.protein * CAL_PER_G.protein,
    carbs: macros.carbs * CAL_PER_G.carbs,
    fat: macros.fat * CAL_PER_G.fat,
  };
  const totalCals = cals.protein + cals.carbs + cals.fat;

  const items = [
    { key: "protein", label: "Protein", grams: macros.protein, target: targets?.protein },
    { key: "carbs", label: "Carbs", grams: macros.carbs, target: targets?.carbs },
    { key: "fat", label: "Fat", grams: macros.fat, target: targets?.fat },
  ] as const;

  return (
    <View>
      {/* Stacked proportion bar */}
      <View className="h-3 rounded-full overflow-hidden flex-row bg-surface2">
        {totalCals > 0 ? (
          items.map((it) => (
            <View
              key={it.key}
              style={{
                flex: cals[it.key] / totalCals,
                backgroundColor: MACRO_COLORS[it.key],
              }}
            />
          ))
        ) : (
          <View className="flex-1" />
        )}
      </View>

      {/* Per-macro gram readouts */}
      <View className="flex-row justify-between mt-3">
        {items.map((it) => (
          <View key={it.key} className="flex-row items-center">
            <View
              className="w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ backgroundColor: MACRO_COLORS[it.key] }}
            />
            <Text className="text-textSecondary text-sm">
              {it.label}{" "}
              <Text
                className="text-textPrimary font-display"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {Math.round(it.grams)}g
              </Text>
              {it.target ? (
                <Text className="text-textMuted"> / {Math.round(it.target)}g</Text>
              ) : null}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
