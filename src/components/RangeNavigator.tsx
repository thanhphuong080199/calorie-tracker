import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors } from "@/theme/colors";

interface Props {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** Prev/next stepper for a trend period. Mirrors DateNavigator but the caller
 *  owns the period math (week vs month vs year). */
export default function RangeNavigator({ label, canGoNext, onPrev, onNext }: Props) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={onPrev}
        hitSlop={12}
        className="w-10 h-10 rounded-full items-center justify-center active:bg-surface2"
      >
        <ChevronLeft color={colors.textSecondary} size={24} />
      </Pressable>

      <Text className="text-textPrimary text-base font-semibold">{label}</Text>

      <Pressable
        onPress={() => canGoNext && onNext()}
        disabled={!canGoNext}
        hitSlop={12}
        className="w-10 h-10 rounded-full items-center justify-center active:bg-surface2"
        style={{ opacity: canGoNext ? 1 : 0.25 }}
      >
        <ChevronRight color={colors.textSecondary} size={24} />
      </Pressable>
    </View>
  );
}
