import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/colors";

/** Grams of each macro. */
export interface MacroGrams {
  carbs: number;
  protein: number;
  fat: number;
}

export const MACRO_COLORS = {
  carbs: "#EF5350", // red
  protein: "#F5A623", // amber
  fat: "#4A90E2", // blue
} as const;

interface Props {
  calories: number;
  macros: MacroGrams;
  size?: number;
  strokeWidth?: number;
}

/**
 * Three-segment calorie donut: carbs / protein / fat by their share of energy
 * (4·4·9 kcal/g), total kcal in the centre. Mirrors the plan-ready mock.
 */
export default function MacroDonut({
  calories,
  macros,
  size = 200,
  strokeWidth = 26,
}: Props) {
  const energy = {
    carbs: macros.carbs * 4,
    protein: macros.protein * 4,
    fat: macros.fat * 9,
  };
  const total = energy.carbs + energy.protein + energy.fat || 1;
  const segments = [
    { key: "carbs" as const, frac: energy.carbs / total },
    { key: "protein" as const, frac: energy.protein / total },
    { key: "fat" as const, frac: energy.fat / total },
  ];

  const radius = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((s) => {
          const len = s.frac * C;
          const circle = (
            <Circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={MACRO_COLORS[s.key]}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          acc += len;
          return circle;
        })}
      </Svg>

      <View className="absolute items-center justify-center">
        <Text
          className="text-textPrimary text-4xl font-display"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {calories.toLocaleString()}
        </Text>
        <Text className="text-textMuted text-sm">kcal</Text>
      </View>
    </View>
  );
}
