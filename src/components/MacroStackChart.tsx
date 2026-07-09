import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { colors } from "@/theme/colors";
import { TrendBucket } from "@/utils/trends";

// Chart palette matching the reference design's legend.
export const TREND_MACRO_COLORS = {
  carbs: "#EF5350", // red
  protein: "#F5A623", // amber
  fat: "#4A90E2", // blue
} as const;

interface Props {
  buckets: TrendBucket[];
  selected: number;
  onSelect: (index: number) => void;
}

const H = 150;
const PAD = { t: 8, b: 20 };

/** Energy share (0–1) of each macro for a bucket, using 4·4·9 kcal/g. */
function split(b: TrendBucket) {
  const c = b.carbs * 4;
  const p = b.protein * 4;
  const f = b.fat * 9;
  const total = c + p + f;
  if (total === 0) return null;
  return { carbs: c / total, protein: p / total, fat: f / total };
}

/**
 * Per-bucket 100%-stacked macro bars (carbs / protein / fat by energy share).
 * Empty buckets render as a quiet track. Tapping a bar selects it.
 */
export default function MacroStackChart({ buckets, selected, onSelect }: Props) {
  const [w, setW] = useState(0);
  const n = buckets.length;
  const plotH = H - PAD.t - PAD.b;
  const slotW = n > 0 ? w / n : 0;
  const barW = Math.min(slotW * 0.5, 26);

  return (
    <View style={{ height: H }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {buckets.map((b, i) => {
            const cx = slotW * (i + 0.5);
            const s = split(b);
            if (!s) {
              return (
                <Rect
                  key={b.key}
                  x={cx - barW / 2}
                  y={PAD.t}
                  width={barW}
                  height={plotH}
                  rx={barW / 2}
                  fill={colors.surface2}
                />
              );
            }
            const dim = i !== selected ? 0.55 : 1;
            // Stack bottom→top: carbs, protein, fat.
            const segs = [
              { h: s.carbs * plotH, color: TREND_MACRO_COLORS.carbs },
              { h: s.protein * plotH, color: TREND_MACRO_COLORS.protein },
              { h: s.fat * plotH, color: TREND_MACRO_COLORS.fat },
            ];
            let yTop = PAD.t + plotH;
            return (
              <React.Fragment key={b.key}>
                {segs.map((seg, j) => {
                  yTop -= seg.h;
                  return (
                    <Rect
                      key={j}
                      x={cx - barW / 2}
                      y={yTop}
                      width={barW}
                      height={seg.h}
                      fillOpacity={dim}
                      fill={seg.color}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* x-axis labels */}
          {buckets.map((b, i) => (
            <SvgText
              key={`x-${b.key}`}
              x={slotW * (i + 0.5)}
              y={H - 5}
              fontSize={10}
              fill={i === selected ? colors.textPrimary : colors.textMuted}
              fontWeight={i === selected ? "700" : "400"}
              textAnchor="middle"
            >
              {b.label}
            </SvgText>
          ))}
        </Svg>
      )}

      {w > 0 && (
        <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
          {buckets.map((b, i) => (
            <Pressable key={`hit-${b.key}`} style={{ flex: 1 }} onPress={() => onSelect(i)} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Overall energy split across a set of buckets, as whole-number percents. */
export function overallSplit(buckets: TrendBucket[]) {
  const c = buckets.reduce((s, b) => s + b.carbs * 4, 0);
  const p = buckets.reduce((s, b) => s + b.protein * 4, 0);
  const f = buckets.reduce((s, b) => s + b.fat * 9, 0);
  const total = c + p + f;
  if (total === 0) return { carbs: 0, protein: 0, fat: 0 };
  return {
    carbs: Math.round((c / total) * 100),
    protein: Math.round((p / total) * 100),
    fat: Math.round((f / total) * 100),
  };
}
