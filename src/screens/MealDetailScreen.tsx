import React from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  X,
  Trash2,
  Pencil,
  Database,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react-native";
import { RootStackParamList } from "@/navigation/types";
import { useLogStore } from "@/store/logStore";
import { formatTime } from "@/utils/date";
import { tapWarning } from "@/utils/haptics";
import { colors } from "@/theme/colors";
import { MACRO_COLORS } from "@/components/MacroBar";

function MacroPill({
  label,
  grams,
  color,
}: {
  label: string;
  grams: number;
  color: string;
}) {
  return (
    <View className="items-center flex-1">
      <Text
        className="text-textPrimary text-xl font-display"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {Math.round(grams)}g
      </Text>
      <View className="flex-row items-center mt-1">
        <View
          className="w-2 h-2 rounded-full mr-1"
          style={{ backgroundColor: color }}
        />
        <Text className="text-textMuted text-xs">{label}</Text>
      </View>
    </View>
  );
}

/** Read-only detail for a single logged meal: photo, totals, macros, components. */
export default function MealDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { date, mealId } =
    useRoute<RouteProp<RootStackParamList, "MealDetail">>().params;

  const meal = useLogStore((s) =>
    s.logs[date]?.meals.find((m) => m.id === mealId),
  );
  const deleteMeal = useLogStore((s) => s.deleteMeal);

  const handleDelete = () => {
    tapWarning();
    deleteMeal(date, mealId);
    navigation.goBack();
  };

  // The meal was deleted out from under us (or bad params): bail gracefully.
  if (!meal) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-8">
        <UtensilsCrossed color={colors.textMuted} size={40} />
        <Text className="text-textMuted text-center mt-3">
          This meal is no longer available.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-6 bg-surface2 rounded-xl px-6 py-3 active:opacity-80"
        >
          <Text className="text-textPrimary font-semibold">Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const items = meal.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface2 active:opacity-70"
        >
          <X color={colors.textPrimary} size={20} />
        </Pressable>
        <Text className="text-textSecondary text-sm">
          {formatTime(meal.timestamp)}
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() =>
              navigation.navigate("ManualEntry", { date, mealId })
            }
            hitSlop={8}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface2 active:opacity-70"
          >
            <Pencil color={colors.textPrimary} size={18} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface2 active:opacity-70"
          >
            <Trash2 color={colors.danger} size={19} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        {meal.imageUri ? (
          <Image
            source={{ uri: meal.imageUri }}
            style={{ width: "100%", height: 220, borderRadius: 24 }}
          />
        ) : (
          <View
            className="bg-surface2 items-center justify-center"
            style={{ width: "100%", height: 220, borderRadius: 24 }}
          >
            <UtensilsCrossed color={colors.textMuted} size={48} />
          </View>
        )}

        {/* Title + meta */}
        <Text className="text-textPrimary text-2xl font-bold mt-5">
          {meal.name}
        </Text>
        {meal.servingG > 0 ? (
          <Text className="text-textMuted text-sm mt-1">
            {meal.servingG}g total
          </Text>
        ) : null}

        {/* Calorie total */}
        <View className="items-center my-6">
          <Text
            className="text-textPrimary text-6xl font-display"
            style={{ fontVariant: ["tabular-nums"], letterSpacing: -1 }}
          >
            {meal.calories}
          </Text>
          <Text className="text-textMuted text-sm mt-1">kcal</Text>
        </View>

        {/* Macros */}
        <View className="flex-row justify-between bg-surface rounded-2xl p-4">
          <MacroPill label="Protein" grams={meal.protein} color={MACRO_COLORS.protein} />
          <MacroPill label="Carbs" grams={meal.carbs} color={MACRO_COLORS.carbs} />
          <MacroPill label="Fat" grams={meal.fat} color={MACRO_COLORS.fat} />
        </View>

        {/* Components breakdown */}
        {items.length > 0 ? (
          <>
            <Text className="text-textSecondary text-sm font-semibold mt-6 mb-2">
              {items.length} {items.length === 1 ? "component" : "components"}
            </Text>
            {items.map((item, index) => {
              const fromOff = item.source === "openfoodfacts";
              return (
                <View
                  key={`${item.name}-${index}`}
                  className="bg-surface rounded-2xl p-3 mb-2"
                >
                  <View className="flex-row items-center">
                    {fromOff ? (
                      <Database color={colors.textMuted} size={14} />
                    ) : (
                      <Sparkles color={colors.warn} size={14} />
                    )}
                    <Text
                      className="text-textPrimary font-semibold ml-2 flex-1"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {item.calories} kcal
                    </Text>
                  </View>
                  <Text className="text-textMuted text-xs mt-1">
                    {item.grams}g · P {Math.round(item.protein)} · C{" "}
                    {Math.round(item.carbs)} · F {Math.round(item.fat)}
                  </Text>
                </View>
              );
            })}
          </>
        ) : null}

        {/* Source note */}
        <Text className="text-textMuted text-xs text-center mt-6">
          {meal.source === "openfoodfacts"
            ? "Nutrition from Open Food Facts"
            : meal.source === "manual"
              ? "Entered manually"
              : "Nutrition estimated by AI"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
