import React from "react";
import { View, Text, Pressable } from "react-native";
import WheelPicker from "@/components/WheelPicker";
import { parseHM, toHM } from "@/utils/time";

interface Props {
  value: string; // "HH:MM" (24-hour)
  onChange: (hm: string) => void;
}

const MIN_STEP = 5;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 60 / MIN_STEP }, (_, i) =>
  String(i * MIN_STEP).padStart(2, "0"),
);

/** 12-hour time wheel (hour · minute · AM/PM) that reads and writes a 24-hour
 *  "HH:MM" string. Built on the existing WheelPicker for a consistent feel. */
export default function TimePicker({ value, onChange }: Props) {
  const { hour, minute } = parseHM(value);
  const period: "AM" | "PM" = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minuteIdx = Math.round(minute / MIN_STEP) % MINUTES.length;

  const emit = (h12: number, mIdx: number, p: "AM" | "PM") => {
    let h24 = h12 % 12; // 12 → 0
    if (p === "PM") h24 += 12; // 12 PM → 12, 1 PM → 13 …
    onChange(toHM(h24, mIdx * MIN_STEP));
  };

  return (
    <View className="flex-row items-center justify-center">
      <WheelPicker
        key={`h-${period}`}
        items={HOURS}
        selectedIndex={hour12 - 1}
        onChange={(i) => emit(HOURS[i], minuteIdx, period)}
        width={56}
        visibleCount={3}
      />
      <Text className="text-textMuted text-xl mx-1">:</Text>
      <WheelPicker
        items={MINUTES}
        selectedIndex={minuteIdx}
        onChange={(i) => emit(hour12, i, period)}
        width={56}
        visibleCount={3}
      />

      <View className="ml-4">
        {(["AM", "PM"] as const).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => active || emit(hour12, minuteIdx, p)}
              className={`px-4 py-2 my-0.5 rounded-xl items-center ${
                active ? "bg-accent" : "bg-surface2"
              }`}
            >
              <Text
                className={`font-semibold ${active ? "text-onAccent" : "text-textSecondary"}`}
              >
                {p}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
