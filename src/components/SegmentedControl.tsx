import React from "react";
import { View, Text, Pressable } from "react-native";
import { tapLight } from "@/utils/haptics";

export interface Segment<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill-style segmented toggle (Weekly / Monthly / Yearly). The active segment
 *  gets the accent fill; the rest are quiet. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View className="flex-row bg-surface2 rounded-full p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!active) {
                tapLight();
                onChange(opt.value);
              }
            }}
            className={`flex-1 py-2 rounded-full items-center ${active ? "bg-accent" : ""}`}
          >
            <Text
              className={`text-sm font-semibold ${active ? "text-onAccent" : "text-textSecondary"}`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
