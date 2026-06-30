import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, progressColor } from "@/theme/colors";

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

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Cap the visible arc at one full turn even when over target.
  const progress = Math.min(fraction, 1);
  const dashOffset = circumference * (1 - progress);

  const remaining = target - consumed;
  const over = remaining < 0;

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
      <View className="absolute items-center justify-center">
        <Text className="text-textPrimary text-5xl font-bold">{consumed}</Text>
        <Text className="text-textMuted text-sm mt-0.5">of {target} kcal</Text>
        <Text
          className="text-base font-semibold mt-2"
          style={{ color: over ? colors.danger : colors.textSecondary }}
        >
          {over
            ? `${Math.abs(remaining)} over`
            : `${remaining} left`}
        </Text>
      </View>
    </View>
  );
}
