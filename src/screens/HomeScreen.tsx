import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, Search, UtensilsCrossed } from "lucide-react-native";
import { RootStackParamList } from "@/navigation/types";
import { useLogStore } from "@/store/logStore";
import { useSettingsStore } from "@/store/settingsStore";
import { totalCalories, totalMacros } from "@/utils/nutrition";
import { today, isToday } from "@/utils/date";
import { tapLight } from "@/utils/haptics";
import { colors } from "@/theme/colors";
import CalorieRing from "@/components/CalorieRing";
import MacroBar from "@/components/MacroBar";
import DateNavigator from "@/components/DateNavigator";
import MealRow from "@/components/MealRow";

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [date, setDate] = useState(today());

  const log = useLogStore((s) => s.logs[date]);
  const deleteMeal = useLogStore((s) => s.deleteMeal);
  const settings = useSettingsStore((s) => s);

  const meals = log?.meals ?? [];
  // Past days keep their snapshotted target; today follows the live setting.
  const target = log?.calorieTarget ?? settings.dailyCalorieTarget;

  const consumed = useMemo(() => totalCalories(meals), [meals]);
  const macros = useMemo(() => totalMacros(meals), [meals]);

  const macroTargets = {
    protein: settings.proteinTarget,
    carbs: settings.carbsTarget,
    fat: settings.fatTarget,
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 flex-row items-center">
        <Text className="text-textPrimary text-xl font-display">
          Calorie Tracker
        </Text>
        <Text className="text-accent text-xl font-display">.</Text>
      </View>
      <View className="px-5 pt-1 pb-3">
        <DateNavigator date={date} onChange={setDate} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ring */}
        <View className="items-center mt-2 mb-6">
          <CalorieRing consumed={consumed} target={target} />
        </View>

        {/* Macros */}
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <MacroBar macros={macros} targets={macroTargets} />
        </View>

        {/* Meal list */}
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-textSecondary text-sm font-semibold">
            {meals.length > 0
              ? `${meals.length} ${meals.length === 1 ? "meal" : "meals"}`
              : "Meals"}
          </Text>
          {isToday(date) ? (
            <Pressable
              onPress={() => {
                tapLight();
                navigation.navigate("ManualEntry", { date });
              }}
              hitSlop={8}
              className="flex-row items-center active:opacity-70"
            >
              <Search color={colors.accent} size={15} />
              <Text className="text-accent text-sm font-semibold ml-1">
                Add food
              </Text>
            </Pressable>
          ) : null}
        </View>

        {meals.length === 0 ? (
          <View className="items-center justify-center py-12">
            <UtensilsCrossed color={colors.textMuted} size={40} />
            <Text className="text-textMuted text-center mt-3">
              {isToday(date)
                ? "No meals yet today.\nTap + to scan your first meal."
                : "No meals logged this day."}
            </Text>
          </View>
        ) : (
          meals.map((meal) => (
            <MealRow
              key={meal.id}
              meal={meal}
              onDelete={(id) => deleteMeal(date, id)}
              onPress={(id) => navigation.navigate("MealDetail", { date, mealId: id })}
            />
          ))
        )}
      </ScrollView>

      {/* FAB — only meaningful for today */}
      {isToday(date) ? (
        <Pressable
          onPress={() => {
            tapLight();
            navigation.navigate("Scan");
          }}
          className="absolute bottom-8 right-6 w-16 h-16 rounded-full bg-accent items-center justify-center active:opacity-80"
          style={{
            shadowColor: colors.accent,
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Plus color={colors.onAccent} size={32} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
