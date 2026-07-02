import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { colors } from "@/theme/colors";

interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  /** Draw a taller, labelled tick every N steps. */
  majorEvery?: number;
}

const TICK_GAP = 12;

/**
 * Horizontal ruler / dial the user scrolls to pick a number (height, weight).
 * A fixed accent line marks the centre; the value under it is the selection.
 */
export default function RulerPicker({
  min,
  max,
  step,
  value,
  onChange,
  unit,
  majorEvery = 10,
}: Props) {
  const ref = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const count = Math.round((max - min) / step) + 1;
  const decimals = step < 1 ? 1 : 0;
  const indexOf = (v: number) => Math.round((v - min) / step);

  // Once we know our width (so the centre padding is correct), jump to `value`.
  useEffect(() => {
    if (width > 0) {
      ref.current?.scrollTo({ x: indexOf(value) * TICK_GAP, animated: false });
    }
    // Only re-run when width is first measured; value changes come from scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    let idx = Math.round(x / TICK_GAP);
    idx = Math.max(0, Math.min(count - 1, idx));
    const v = Math.round((min + idx * step) * 10) / 10;
    if (v !== value) onChange(v);
  };

  return (
    <View>
      <View className="flex-row items-baseline justify-center">
        <Text
          className="text-textPrimary font-display"
          numberOfLines={1}
          style={{ fontSize: 44, fontVariant: ["tabular-nums"] }}
        >
          {value.toFixed(decimals)}
        </Text>
        <Text className="text-textMuted ml-1.5" style={{ fontSize: 20 }}>
          {unit}
        </Text>
      </View>

      <View
        style={{ height: 68, marginTop: 12 }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {/* Fixed centre indicator */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: 40,
            marginLeft: -1.5,
            borderRadius: 2,
            backgroundColor: colors.accent,
            zIndex: 1,
          }}
        />
        {width > 0 && (
          <ScrollView
            ref={ref}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_GAP}
            decelerationRate="fast"
            onMomentumScrollEnd={handleEnd}
            contentContainerStyle={{ paddingHorizontal: width / 2 - TICK_GAP / 2 }}
          >
            {Array.from({ length: count }).map((_, i) => {
              const major = i % majorEvery === 0;
              return (
                <View key={i} style={{ width: TICK_GAP, alignItems: "center" }}>
                  <View
                    style={{
                      width: major ? 2 : 1,
                      height: major ? 28 : 16,
                      backgroundColor: major ? colors.textSecondary : colors.border,
                    }}
                  />
                  {major && (
                    <Text
                      className="text-textMuted"
                      style={{ fontSize: 10, marginTop: 4 }}
                    >
                      {Math.round(min + i * step)}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
