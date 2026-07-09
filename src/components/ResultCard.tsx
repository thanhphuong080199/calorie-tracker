import React from "react";
import { View, Text, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { RotateCcw, Check, Database, Sparkles, X } from "lucide-react-native";
import { RecognitionItem, Confidence } from "@/types";
import {
  scalePer100,
  sumNutrition,
  ITEM_GRAM_MIN,
  ITEM_GRAM_MAX,
} from "@/utils/nutrition";
import { colors } from "@/theme/colors";
import ConfidenceBadge from "./ConfidenceBadge";
import { MACRO_COLORS } from "./MacroBar";

interface Props {
  name: string;
  /** Recognition confidence badge. Omitted when editing an already-saved meal. */
  confidence?: Confidence;
  items: RecognitionItem[];
  onChangeGrams: (index: number, grams: number) => void;
  onRemoveItem: (index: number) => void;
  onSave: () => void;
  /** Retake the photo. Omitted (with the button hidden) in edit mode. */
  onRetake?: () => void;
  /** Label for the primary action button. Defaults to "Save". */
  saveLabel?: string;
}

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
        className="text-textPrimary text-lg font-display"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {Math.round(grams)}g
      </Text>
      <View className="flex-row items-center mt-0.5">
        <View
          className="w-2 h-2 rounded-full mr-1"
          style={{ backgroundColor: color }}
        />
        <Text className="text-textMuted text-xs">{label}</Text>
      </View>
    </View>
  );
}

function ItemRow({
  item,
  canRemove,
  onChangeGrams,
  onRemove,
}: {
  item: RecognitionItem;
  canRemove: boolean;
  onChangeGrams: (grams: number) => void;
  onRemove: () => void;
}) {
  const scaled = scalePer100(item, item.grams);
  const fromOff = item.source === "openfoodfacts";

  return (
    <View className="bg-surface2 rounded-2xl p-3 mb-2">
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
        <Text className="text-textSecondary text-sm mr-2">
          {scaled.calories} kcal
        </Text>
        {canRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} className="active:opacity-60">
            <X color={colors.textMuted} size={18} />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center mt-1">
        <Slider
          style={{ flex: 1 }}
          minimumValue={ITEM_GRAM_MIN}
          maximumValue={ITEM_GRAM_MAX}
          step={5}
          value={item.grams}
          onValueChange={(v) => onChangeGrams(Math.round(v))}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
        <Text className="text-textPrimary text-sm font-semibold w-16 text-right">
          {item.grams} g
        </Text>
      </View>
    </View>
  );
}

/** Editable multi-component recognition result: per-item grams + Save/Retake. */
export default function ResultCard({
  name,
  confidence,
  items,
  onChangeGrams,
  onRemoveItem,
  onSave,
  onRetake,
  saveLabel = "Save",
}: Props) {
  const totals = sumNutrition(items.map((it) => scalePer100(it, it.grams)));
  const offCount = items.filter((i) => i.source === "openfoodfacts").length;

  const sourceLabel =
    offCount === items.length
      ? "Open Food Facts"
      : offCount === 0
        ? "AI estimate"
        : `${offCount}/${items.length} from Open Food Facts`;

  return (
    <View className="bg-surface rounded-3xl p-5">
      {/* Title + meta */}
      <Text className="text-textPrimary text-2xl font-bold" numberOfLines={2}>
        {name}
      </Text>
      <View className="flex-row items-center mt-2 gap-2">
        {confidence ? <ConfidenceBadge level={confidence} /> : null}
        <Text className="text-textMuted text-xs">{sourceLabel}</Text>
      </View>

      {/* Meal total */}
      <View className="items-center my-5">
        <Text
          className="text-textPrimary text-5xl font-display"
          style={{ fontVariant: ["tabular-nums"], letterSpacing: -1 }}
        >
          {totals.calories}
        </Text>
        <Text className="text-textMuted text-sm mt-1">kcal total</Text>
      </View>

      <View className="flex-row justify-between mb-5">
        <MacroPill
          label="Protein"
          grams={totals.protein}
          color={MACRO_COLORS.protein}
        />
        <MacroPill label="Carbs" grams={totals.carbs} color={MACRO_COLORS.carbs} />
        <MacroPill label="Fat" grams={totals.fat} color={MACRO_COLORS.fat} />
      </View>

      {/* Components */}
      <Text className="text-textSecondary text-sm font-semibold mb-2">
        Components — drag to adjust grams
      </Text>
      {items.map((item, index) => (
        <ItemRow
          key={`${item.name}-${index}`}
          item={item}
          canRemove={items.length > 1}
          onChangeGrams={(g) => onChangeGrams(index, g)}
          onRemove={() => onRemoveItem(index)}
        />
      ))}

      {/* Actions */}
      <View className="flex-row gap-3 mt-3">
        {onRetake ? (
          <Pressable
            onPress={onRetake}
            className="flex-1 flex-row items-center justify-center bg-surface2 rounded-xl py-3.5 active:opacity-80"
          >
            <RotateCcw color={colors.textPrimary} size={18} />
            <Text className="text-textPrimary font-semibold ml-2">Retake</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSave}
          className="flex-1 flex-row items-center justify-center bg-accent rounded-xl py-3.5 active:opacity-80"
        >
          <Check color={colors.onAccent} size={18} strokeWidth={2.5} />
          <Text className="text-onAccent font-bold ml-2">{saveLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
