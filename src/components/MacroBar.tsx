import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Macros } from "@/types";
import { colors } from "@/theme/colors";

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

/** A single macro's progress ring: grams filled toward its target. */
function MacroRing({
  label,
  grams,
  target,
  color,
}: {
  label: string;
  grams: number;
  target?: number;
  color: string;
}) {
  const size = 78;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const frac = target && target > 0 ? Math.min(1, grams / target) : 0;
  const len = frac * C;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface2}
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress */}
          {frac > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
        <View className="absolute items-center justify-center">
          <Text
            className="text-textPrimary font-display leading-none"
            style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}
          >
            {Math.round(grams)}
          </Text>
          <Text className="text-textMuted leading-none" style={{ fontSize: 10 }}>
            g
          </Text>
        </View>
      </View>
      <Text className="text-textSecondary text-sm mt-2">{label}</Text>
      {target ? (
        <Text className="text-textMuted" style={{ fontSize: 11 }}>
          of {Math.round(target)}g
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Per-macro progress rings (Protein / Carbs / Fat). Each ring fills toward its
 * gram target; the gram total sits in the centre.
 */
export default function MacroBar({ macros, targets }: Props) {
  const items = [
    { key: "protein", label: "Protein", grams: macros.protein, target: targets?.protein },
    { key: "carbs", label: "Carbs", grams: macros.carbs, target: targets?.carbs },
    { key: "fat", label: "Fat", grams: macros.fat, target: targets?.fat },
  ] as const;

  return (
    <View className="flex-row justify-around">
      {items.map((it) => (
        <MacroRing
          key={it.key}
          label={it.label}
          grams={it.grams}
          target={it.target}
          color={MACRO_COLORS[it.key]}
        />
      ))}
    </View>
  );
}
