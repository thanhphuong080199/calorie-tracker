import React from "react";
import { View, Text } from "react-native";
import { Confidence } from "@/types";
import { colors } from "@/theme/colors";

const MAP: Record<Confidence, { label: string; color: string }> = {
  high: { label: "High confidence", color: colors.accent },
  medium: { label: "Medium confidence", color: colors.warn },
  low: { label: "Low confidence", color: colors.danger },
};

/** Small colored pill conveying how sure the recognition is. */
export default function ConfidenceBadge({ level }: { level: Confidence }) {
  const { label, color } = MAP[level];
  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}22` }}
    >
      <View
        className="w-2 h-2 rounded-full mr-1.5"
        style={{ backgroundColor: color }}
      />
      <Text className="text-textPrimary text-xs font-medium">{label}</Text>
    </View>
  );
}
