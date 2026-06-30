import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, Trash2 } from "lucide-react-native";
import { useSettingsStore } from "@/store/settingsStore";
import { useLogStore } from "@/store/logStore";
import { computeStreak, today } from "@/utils/date";
import { colors } from "@/theme/colors";

/** Parse a numeric input to a positive integer, or undefined when blank. */
function toNum(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

interface FieldProps {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}

function NumberField({ label, unit, value, onChangeText, placeholder }: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-textSecondary mb-2">{label}</Text>
      <View className="flex-row items-center bg-surface2 rounded-xl px-4">
        <TextInput
          className="flex-1 text-textPrimary py-3 text-lg"
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
        />
        <Text className="text-textMuted ml-2">{unit}</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s);
  const setDailyCalorieTarget = useSettingsStore((s) => s.setDailyCalorieTarget);
  const setMacroTargets = useSettingsStore((s) => s.setMacroTargets);

  const loggedDates = useLogStore((s) => s.loggedDates);
  const clearDay = useLogStore((s) => s.clearDay);
  const todaysMealCount = useLogStore(
    (s) => s.logs[today()]?.meals.length ?? 0,
  );

  const [calorie, setCalorie] = useState(String(settings.dailyCalorieTarget));
  const [protein, setProtein] = useState(
    settings.proteinTarget ? String(settings.proteinTarget) : "",
  );
  const [carbs, setCarbs] = useState(
    settings.carbsTarget ? String(settings.carbsTarget) : "",
  );
  const [fat, setFat] = useState(
    settings.fatTarget ? String(settings.fatTarget) : "",
  );
  const [saved, setSaved] = useState(false);

  const streak = computeStreak(loggedDates());

  const onSave = () => {
    const kcal = toNum(calorie);
    if (kcal && kcal > 0) setDailyCalorieTarget(kcal);
    setMacroTargets({
      proteinTarget: toNum(protein),
      carbsTarget: toNum(carbs),
      fatTarget: toNum(fat),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onClearToday = () => {
    if (todaysMealCount === 0) return;
    Alert.alert(
      "Clear today's meals?",
      `This removes all ${todaysMealCount} meal${
        todaysMealCount === 1 ? "" : "s"
      } logged today. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearDay(today()),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-textPrimary text-2xl font-bold mb-6">
          Settings
        </Text>

        {/* Streak card */}
        <View className="flex-row items-center bg-surface rounded-2xl p-4 mb-6">
          <View className="w-11 h-11 rounded-full bg-surface2 items-center justify-center mr-3">
            <Flame color={colors.warn} size={24} />
          </View>
          <View>
            <Text className="text-textPrimary text-xl font-bold">
              {streak} day{streak === 1 ? "" : "s"}
            </Text>
            <Text className="text-textMuted text-sm">
              {streak > 0 ? "Logging streak" : "Log a meal to start a streak"}
            </Text>
          </View>
        </View>

        {/* Targets */}
        <Text className="text-textSecondary text-sm font-semibold mb-3">
          DAILY TARGETS
        </Text>

        <NumberField
          label="Calorie target"
          unit="kcal"
          value={calorie}
          onChangeText={setCalorie}
          placeholder="2000"
        />

        <Text className="text-textMuted text-xs mb-3 -mt-1">
          Macro targets are optional — leave blank to hide them.
        </Text>

        <NumberField
          label="Protein"
          unit="g"
          value={protein}
          onChangeText={setProtein}
          placeholder="—"
        />
        <NumberField
          label="Carbs"
          unit="g"
          value={carbs}
          onChangeText={setCarbs}
          placeholder="—"
        />
        <NumberField
          label="Fat"
          unit="g"
          value={fat}
          onChangeText={setFat}
          placeholder="—"
        />

        <Pressable
          onPress={onSave}
          className="bg-accent rounded-xl py-3.5 items-center active:opacity-80 mt-2"
        >
          <Text className="text-bg font-bold text-base">
            {saved ? "Saved ✓" : "Save"}
          </Text>
        </Pressable>

        {/* Danger zone */}
        <Text className="text-textSecondary text-sm font-semibold mb-3 mt-8">
          DATA
        </Text>
        <Pressable
          onPress={onClearToday}
          disabled={todaysMealCount === 0}
          className="flex-row items-center justify-center bg-surface rounded-xl py-3.5 active:opacity-80"
          style={{ opacity: todaysMealCount === 0 ? 0.4 : 1 }}
        >
          <Trash2 color={colors.danger} size={18} />
          <Text className="text-danger font-semibold ml-2">
            Clear today's meals
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
