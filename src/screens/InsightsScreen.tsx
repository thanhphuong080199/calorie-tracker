import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChartColumn, ChartLine } from "lucide-react-native";
import { useLogStore } from "@/store/logStore";
import { useSettingsStore } from "@/store/settingsStore";
import { today } from "@/utils/date";
import { tapLight } from "@/utils/haptics";
import { colors } from "@/theme/colors";
import {
  buildPeriod,
  isFuturePeriod,
  shiftPeriod,
  TrendRange,
} from "@/utils/trends";
import SegmentedControl from "@/components/SegmentedControl";
import RangeNavigator from "@/components/RangeNavigator";
import CalorieTrendChart, { ChartType } from "@/components/CalorieTrendChart";
import MacroStackChart, {
  overallSplit,
  TREND_MACRO_COLORS,
} from "@/components/MacroStackChart";

const RANGES = [
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "year" },
] as const satisfies readonly { label: string; value: TrendRange }[];

/** Small colored-dot label used in the chart legends. */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="text-textSecondary text-xs ml-1.5">{label}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const [range, setRange] = useState<TrendRange>("week");
  const [anchor, setAnchor] = useState(today());
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [selected, setSelected] = useState(0);

  const logs = useLogStore((s) => s.logs);
  const goal = useSettingsStore((s) => s.dailyCalorieTarget);

  const period = useMemo(
    () => buildPeriod(range, anchor, logs, goal),
    [range, anchor, logs, goal],
  );

  // On period change, jump the selection to the latest bucket that has data.
  useEffect(() => {
    let idx = period.buckets.length - 1;
    for (let i = period.buckets.length - 1; i >= 0; i--) {
      if (period.buckets[i].loggedDays > 0) {
        idx = i;
        break;
      }
    }
    setSelected(idx);
  }, [period]);

  const macroPct = useMemo(() => overallSplit(period.buckets), [period]);
  const canGoNext = !isFuturePeriod(range, anchor);
  const step = (dir: 1 | -1) => setAnchor((a) => shiftPeriod(range, a, dir));

  const vsGoal = period.avgCalories - goal;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 flex-row items-center">
        <Text className="text-textPrimary text-xl font-display">Insights</Text>
        <Text className="text-accent text-xl font-display">.</Text>
      </View>

      <View className="px-5 pt-3">
        <SegmentedControl
          options={RANGES}
          value={range}
          onChange={(r) => {
            setRange(r);
            setAnchor(today());
          }}
        />
      </View>
      <View className="px-5 pt-3 pb-1">
        <RangeNavigator
          label={period.label}
          canGoNext={canGoNext}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calorie chart card */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-textPrimary text-base font-display">Calorie (kcal)</Text>
            <View className="flex-row bg-surface2 rounded-lg p-0.5">
              {(
                [
                  { type: "bar" as const, Icon: ChartColumn },
                  { type: "line" as const, Icon: ChartLine },
                ]
              ).map(({ type, Icon }) => {
                const active = chartType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      tapLight();
                      setChartType(type);
                    }}
                    className={`w-8 h-7 rounded-md items-center justify-center ${active ? "bg-accent" : ""}`}
                  >
                    <Icon
                      size={16}
                      color={active ? colors.onAccent : colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row items-center mt-2" style={{ gap: 16 }}>
            <LegendDot color={colors.accent} label="Selected" />
            <View className="flex-row items-center">
              <View style={{ width: 12, height: 0, borderBottomWidth: 1.5, borderColor: "#9DCE63", borderStyle: "dashed" }} />
              <Text className="text-textSecondary text-xs ml-1.5">Calorie Intake Goal</Text>
            </View>
          </View>

          <View className="mt-2">
            <CalorieTrendChart
              buckets={period.buckets}
              goal={goal}
              type={chartType}
              selected={selected}
              onSelect={setSelected}
            />
          </View>

          <View className="flex-row items-center justify-between border-t border-border pt-3 mt-1">
            <Text className="text-textSecondary text-sm">Average / day</Text>
            {period.loggedDays > 0 ? (
              <Text className="text-textPrimary text-sm">
                <Text className="font-display">{period.avgCalories.toLocaleString()}</Text>
                <Text className="text-textMuted"> kcal · </Text>
                <Text style={{ color: vsGoal > 0 ? colors.danger : colors.accent }}>
                  {vsGoal > 0 ? "+" : ""}
                  {vsGoal.toLocaleString()} vs goal
                </Text>
              </Text>
            ) : (
              <Text className="text-textMuted text-sm">No meals logged</Text>
            )}
          </View>
        </View>

        {/* Nutrition (%) card */}
        <View className="bg-surface rounded-2xl p-4">
          <Text className="text-textPrimary text-base font-display">Nutrition (%)</Text>
          <View className="flex-row mt-2" style={{ gap: 16 }}>
            <LegendDot color={TREND_MACRO_COLORS.carbs} label={`Carbs ${macroPct.carbs}%`} />
            <LegendDot color={TREND_MACRO_COLORS.protein} label={`Protein ${macroPct.protein}%`} />
            <LegendDot color={TREND_MACRO_COLORS.fat} label={`Fat ${macroPct.fat}%`} />
          </View>

          <View className="mt-3">
            <MacroStackChart
              buckets={period.buckets}
              selected={selected}
              onSelect={setSelected}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
