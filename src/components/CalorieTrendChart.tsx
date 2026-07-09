import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Svg, {
  Line,
  Rect,
  Path,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { colors } from "@/theme/colors";
import { TrendBucket } from "@/utils/trends";

export type ChartType = "bar" | "line";

interface Props {
  buckets: TrendBucket[];
  goal: number;
  type: ChartType;
  selected: number;
  onSelect: (index: number) => void;
}

const H = 216;
const PAD = { l: 34, r: 12, t: 30, b: 22 };
const BAR_SOFT = "#CFE9AC"; // light accent for unselected bars
const GOAL_LINE = "#9DCE63";

/** Round up to the next 500 so gridlines land on tidy numbers. */
function niceMax(v: number): number {
  return Math.max(1000, Math.ceil(v / 500) * 500);
}

/**
 * Weekly/monthly/yearly calorie chart. Bars or a smoothed area line, a dashed
 * daily-goal line, and a callout bubble over the tapped bucket. Tapping any
 * slot selects it. Width is measured so it fills its card.
 */
export default function CalorieTrendChart({
  buckets,
  goal,
  type,
  selected,
  onSelect,
}: Props) {
  const [w, setW] = useState(0);
  const n = buckets.length;

  const maxVal = Math.max(goal, ...buckets.map((b) => b.value));
  const yMax = niceMax(maxVal);
  const plotW = Math.max(0, w - PAD.l - PAD.r);
  const plotH = H - PAD.t - PAD.b;
  const slotW = n > 0 ? plotW / n : 0;

  const x = (i: number) => PAD.l + slotW * (i + 0.5);
  const y = (v: number) => PAD.t + plotH * (1 - v / yMax);
  const baseY = y(0);

  // Gridlines / y-axis labels every 500 kcal.
  const gridValues: number[] = [];
  for (let g = 500; g <= yMax; g += 500) gridValues.push(g);

  const sel = buckets[selected];
  const selHasData = sel && sel.loggedDays > 0;
  const callout = selHasData ? `${sel.value.toLocaleString()} kcal` : "No data";
  const calloutW = Math.max(58, callout.length * 7 + 18);
  const calloutCX = Math.min(Math.max(x(selected), PAD.l + calloutW / 2), w - PAD.r - calloutW / 2);

  // Line/area connect only populated points, so a skipped day doesn't dip the
  // line to zero (which would read as "ate nothing").
  const pts = buckets.map((b, i) => ({ x: x(i), y: y(b.value), has: b.loggedDays > 0 }));
  const filled = pts.filter((p) => p.has);
  const linePath = filled.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath =
    filled.length > 0
      ? `${linePath} L${filled[filled.length - 1].x} ${baseY} L${filled[0].x} ${baseY} Z`
      : "";

  return (
    <View
      style={{ height: H }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 && (
        <Svg width={w} height={H}>
          <Defs>
            <LinearGradient id="calArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.28} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Gridlines + y labels */}
          {gridValues.map((g) => (
            <React.Fragment key={g}>
              <Line
                x1={PAD.l}
                y1={y(g)}
                x2={w - PAD.r}
                y2={y(g)}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PAD.l - 6}
                y={y(g) + 3}
                fontSize={9}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {g}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Data */}
          {type === "bar"
            ? buckets.map((b, i) => {
                const bw = Math.min(slotW * 0.5, 26);
                const h = plotH * (b.value / yMax);
                if (b.loggedDays === 0) return null;
                return (
                  <Rect
                    key={b.key}
                    x={x(i) - bw / 2}
                    y={y(b.value)}
                    width={bw}
                    height={h}
                    rx={bw / 2}
                    fill={i === selected ? colors.accent : BAR_SOFT}
                  />
                );
              })
            : (
              <>
                <Path d={areaPath} fill="url(#calArea)" />
                <Path
                  d={linePath}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {pts.map((p, i) =>
                  p.has ? (
                    <Circle
                      key={buckets[i].key}
                      cx={p.x}
                      cy={p.y}
                      r={i === selected ? 6 : 4}
                      fill={i === selected ? colors.accent : "#FFFFFF"}
                      stroke={colors.accent}
                      strokeWidth={2}
                    />
                  ) : null,
                )}
              </>
            )}

          {/* Dashed daily-goal line (drawn over data so it stays visible) */}
          <Line
            x1={PAD.l}
            y1={y(goal)}
            x2={w - PAD.r}
            y2={y(goal)}
            stroke={GOAL_LINE}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />

          {/* x-axis labels */}
          {buckets.map((b, i) => (
            <SvgText
              key={`x-${b.key}`}
              x={x(i)}
              y={H - 6}
              fontSize={10}
              fill={i === selected ? colors.textPrimary : colors.textMuted}
              fontWeight={i === selected ? "700" : "400"}
              textAnchor="middle"
            >
              {b.label}
            </SvgText>
          ))}

          {/* Callout bubble over the selected slot */}
          <Rect
            x={calloutCX - calloutW / 2}
            y={2}
            width={calloutW}
            height={20}
            rx={10}
            fill={colors.accent}
          />
          <SvgText
            x={calloutCX}
            y={16}
            fontSize={11}
            fontWeight="700"
            fill={colors.onAccent}
            textAnchor="middle"
          >
            {callout}
          </SvgText>
          <Path
            d={`M${calloutCX - 4} 22 L${calloutCX + 4} 22 L${calloutCX} 27 Z`}
            fill={colors.accent}
          />
        </Svg>
      )}

      {/* Transparent hit targets over each slot */}
      {w > 0 && (
        <View
          style={{
            position: "absolute",
            left: PAD.l,
            top: PAD.t,
            width: plotW,
            height: plotH + PAD.b,
            flexDirection: "row",
          }}
        >
          {buckets.map((b, i) => (
            <Pressable key={`hit-${b.key}`} style={{ flex: 1 }} onPress={() => onSelect(i)} />
          ))}
        </View>
      )}
    </View>
  );
}
