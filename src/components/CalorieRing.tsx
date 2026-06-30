import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  colors,
  progressColor,
  progressStatus,
  PROGRESS_LABEL,
} from "@/theme/colors";

interface Props {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Circular calorie-progress ring. Fills clockwise; color shifts
 * green → orange → red as you approach and exceed the target.
 */
export default function CalorieRing({
  consumed,
  target,
  size = 220,
  strokeWidth = 18,
}: Props) {
  const safeTarget = target > 0 ? target : 1;
  const fraction = consumed / safeTarget;
  const ringColor = progressColor(fraction);
  const status = progressStatus(fraction);
  const statusLabel = PROGRESS_LABEL[status];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Cap the visible arc at one full turn even when over target.
  const progress = Math.min(fraction, 1);
  const dashOffset = circumference * (1 - progress);

  const remaining = target - consumed;
  const over = remaining < 0;
  const remainingText = over ? `${Math.abs(remaining)} over` : `${remaining} left`;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${consumed} of ${target} kcal, ${remainingText}, ${statusLabel.toLowerCase()}`}
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
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Start at 12 o'clock instead of 3 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center readout, absolutely centered over the ring. */}
      <View className="absolute items-center justify-center" accessible={false}>
        <Text
          className="text-textPrimary text-6xl font-display"
          style={{ fontVariant: ["tabular-nums"], letterSpacing: -1 }}
        >
          {consumed}
        </Text>
        <Text className="text-textMuted text-sm mt-0.5">of {target} kcal</Text>

        {/* Status: a non-color word (plus a redundant colored dot) so the
            on-track / near-limit / over state isn't conveyed by hue alone. */}
        <View className="flex-row items-center mt-2">
          <View
            className="w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: ringColor }}
          />
          <Text className="text-textPrimary text-sm font-semibold">
            {statusLabel}
          </Text>
          <Text className="text-textSecondary text-sm"> · {remainingText}</Text>
        </View>
      </View>
    </View>
  );
}
