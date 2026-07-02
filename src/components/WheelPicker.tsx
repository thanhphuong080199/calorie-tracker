import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { colors } from "@/theme/colors";

interface Props {
  items: (string | number)[];
  selectedIndex: number;
  onChange: (index: number) => void;
  itemHeight?: number;
  /** Number of rows visible; should be odd so one sits dead centre. */
  visibleCount?: number;
  width?: number;
}

/**
 * Vertical scroll wheel (iOS-picker style). Snaps each row to the centre; the
 * centred row is the selection. Used for dates and times in onboarding.
 */
export default function WheelPicker({
  items,
  selectedIndex,
  onChange,
  itemHeight = 40,
  visibleCount = 5,
  width,
}: Props) {
  const ref = useRef<ScrollView>(null);
  const height = itemHeight * visibleCount;
  const pad = (height - itemHeight) / 2;

  // Position on the current selection at mount.
  useEffect(() => {
    const id = setTimeout(
      () => ref.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false }),
      0,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    let idx = Math.round(y / itemHeight);
    idx = Math.max(0, Math.min(items.length - 1, idx));
    if (idx !== selectedIndex) onChange(idx);
  };

  return (
    <View style={{ height, width }}>
      {/* Centre band */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: pad,
          left: 0,
          right: 0,
          height: itemHeight,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingVertical: pad }}
      >
        {items.map((it, i) => {
          const active = i === selectedIndex;
          return (
            <View
              key={i}
              style={{
                height: itemHeight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: active ? 22 : 17,
                  fontWeight: active ? "700" : "400",
                  color: active ? colors.accent : colors.textMuted,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {String(it)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
