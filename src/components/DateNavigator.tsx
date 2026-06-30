import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { addDays, formatDateLabel, isFuture, isToday } from "@/utils/date";
import { colors } from "@/theme/colors";

interface Props {
  date: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

/** Prev/next day stepper. Can't navigate into the future. */
export default function DateNavigator({ date, onChange }: Props) {
  const nextDate = addDays(date, 1);
  const canGoNext = !isFuture(nextDate);

  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={() => onChange(addDays(date, -1))}
        hitSlop={12}
        className="w-10 h-10 rounded-full items-center justify-center active:bg-surface2"
      >
        <ChevronLeft color={colors.textSecondary} size={26} />
      </Pressable>

      <View className="items-center">
        <Text className="text-textPrimary text-lg font-semibold">
          {formatDateLabel(date)}
        </Text>
        {!isToday(date) ? (
          <Text className="text-textMuted text-xs mt-0.5">{date}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => canGoNext && onChange(nextDate)}
        disabled={!canGoNext}
        hitSlop={12}
        className="w-10 h-10 rounded-full items-center justify-center active:bg-surface2"
        style={{ opacity: canGoNext ? 1 : 0.25 }}
      >
        <ChevronRight color={colors.textSecondary} size={26} />
      </Pressable>
    </View>
  );
}
