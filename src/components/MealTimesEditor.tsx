import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { MealTimes, MealKey } from "@/types";
import { MEAL_META, formatHM } from "@/utils/time";
import { colors } from "@/theme/colors";
import TimePicker from "@/components/TimePicker";

interface Props {
  value: MealTimes;
  onChange: (value: MealTimes) => void;
}

const MEALS = Object.keys(MEAL_META) as MealKey[];

/**
 * Three tappable meal rows; tapping one expands an inline TimePicker (only one
 * open at a time). Shared by onboarding and Settings so the two stay in sync.
 */
export default function MealTimesEditor({ value, onChange }: Props) {
  const [open, setOpen] = useState<MealKey | null>(null);

  return (
    <View>
      {MEALS.map((key) => {
        const expanded = open === key;
        return (
          <View
            key={key}
            className="bg-surface border border-border rounded-2xl mb-2.5 overflow-hidden"
          >
            <Pressable
              onPress={() => setOpen(expanded ? null : key)}
              className="flex-row items-center px-4 py-3.5 active:opacity-80"
            >
              <Text style={{ fontSize: 20 }} className="mr-3">
                {MEAL_META[key].emoji}
              </Text>
              <Text className="flex-1 text-textPrimary text-base">
                {MEAL_META[key].label}
              </Text>
              <Text
                className={`text-base mr-1.5 ${expanded ? "text-accent font-semibold" : "text-textSecondary"}`}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatHM(value[key])}
              </Text>
              <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
                <ChevronDown color={colors.textMuted} size={18} />
              </View>
            </Pressable>

            {expanded ? (
              <View className="px-4 pb-4 pt-1 border-t border-border">
                <TimePicker
                  value={value[key]}
                  onChange={(hm) => onChange({ ...value, [key]: hm })}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
