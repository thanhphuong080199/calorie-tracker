import React, { useRef } from "react";
import { View, Text, Pressable, Image } from "react-native";
// Classic (Animated-based) Swipeable instead of the Reanimated one: it needs no
// worklets, so it works in Play Store Expo Go where the Reanimated native build
// can mismatch. The deprecation warning is harmless for our use.
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Trash2, Sparkles, UtensilsCrossed } from "lucide-react-native";
import { MealEntry } from "@/types";
import { formatTime } from "@/utils/date";
import { colors } from "@/theme/colors";

interface Props {
  meal: MealEntry;
  onDelete: (id: string) => void;
}

/** A meal list item. Swipe left to reveal a delete action. */
export default function MealRow({ meal, onDelete }: Props) {
  const ref = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        ref.current?.close();
        onDelete(meal.id);
      }}
      className="bg-danger justify-center items-center my-1 rounded-2xl ml-2"
      style={{ width: 80 }}
    >
      <Trash2 color="#FFFFFF" size={22} />
    </Pressable>
  );

  const estimated = meal.source === "gemini_estimate";

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      <View className="flex-row items-center bg-surface rounded-2xl px-3 py-3 my-1">
        {/* Meal thumbnail — placeholder keeps rows aligned when absent. */}
        {meal.imageUri ? (
          <Image
            source={{ uri: meal.imageUri }}
            style={{ width: 52, height: 52, borderRadius: 12 }}
          />
        ) : (
          <View
            className="bg-surface2 items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: 12 }}
          >
            <UtensilsCrossed color={colors.textMuted} size={22} />
          </View>
        )}

        <View className="flex-1 px-3">
          <View className="flex-row items-center">
            <Text
              className="text-textPrimary text-base font-semibold"
              numberOfLines={1}
            >
              {meal.name}
            </Text>
            {estimated ? (
              <Sparkles
                color={colors.warn}
                size={13}
                style={{ marginLeft: 6 }}
              />
            ) : null}
          </View>
          {meal.items && meal.items.length > 1 ? (
            <Text className="text-textSecondary text-xs mt-0.5" numberOfLines={1}>
              {meal.items.map((i) => i.name).join(" · ")}
            </Text>
          ) : null}
          <Text className="text-textMuted text-xs mt-0.5">
            {meal.servingG}g · {formatTime(meal.timestamp)}
          </Text>
        </View>

        <View className="items-end">
          <Text
            className="text-textPrimary text-lg font-display"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {meal.calories}
          </Text>
          <Text className="text-textMuted text-xs">kcal</Text>
        </View>
      </View>
    </Swipeable>
  );
}
