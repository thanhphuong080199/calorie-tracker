import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { X, Check, Search, ChevronLeft, Pencil } from "lucide-react-native";
import { RootStackParamList } from "@/navigation/types";
import { RecognitionItem, MealEntry, MealItem, Source } from "@/types";
import { useLogStore } from "@/store/logStore";
import { searchFoods, OffResult } from "@/services/openFoodFactsService";
import { scalePer100, sumNutrition, clampGrams } from "@/utils/nutrition";
import { newId } from "@/utils/id";
import { tapSuccess } from "@/utils/haptics";
import { colors } from "@/theme/colors";
import { MACRO_COLORS } from "@/components/MacroBar";
import ResultCard from "@/components/ResultCard";

/** Which sub-screen the modal is showing. */
type Phase = "search" | "adjust" | "manual";

/** Turn a persisted (total-based) component back into the per-100g shape the
 *  gram-slider editor expects. Grams of 0 can't be un-scaled, so it reads 0. */
function toRecognitionItem(it: MealItem): RecognitionItem {
  const per100 = (total: number) => (it.grams > 0 ? (total / it.grams) * 100 : 0);
  return {
    name: it.name,
    grams: it.grams,
    caloriesPer100g: per100(it.calories),
    proteinPer100g: per100(it.protein),
    carbsPer100g: per100(it.carbs),
    fatPer100g: per100(it.fat),
    source: it.source,
  };
}

const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Add a meal (search a food database → adjust portion, or type values by hand)
 * or edit an existing one. Photo meals with a component breakdown reuse the
 * Scan gram-slider editor.
 */
export default function ManualEntryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { date, mealId } =
    useRoute<RouteProp<RootStackParamList, "ManualEntry">>().params;

  const existing = useLogStore((s) =>
    mealId ? s.logs[date]?.meals.find((m) => m.id === mealId) : undefined,
  );
  const addMeal = useLogStore((s) => s.addMeal);
  const updateMeal = useLogStore((s) => s.updateMeal);

  const editingComponents = !!existing?.items && existing.items.length > 0;
  const editingManual = !!existing && !editingComponents;

  const [phase, setPhase] = useState<Phase>(
    editingComponents ? "adjust" : editingManual ? "manual" : "search",
  );

  const title = existing ? "Edit meal" : "Add food";

  const closeButton = (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={8}
      className="w-10 h-10 items-center justify-center rounded-full bg-surface2 active:opacity-70"
    >
      <X color={colors.textPrimary} size={20} />
    </Pressable>
  );

  const renderHeader = (onBack?: () => void) => (
    <View className="flex-row items-center px-5 pt-2 pb-1">
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface2 active:opacity-70"
        >
          <ChevronLeft color={colors.textPrimary} size={22} />
        </Pressable>
      ) : (
        closeButton
      )}
      <Text className="text-textPrimary text-lg font-semibold ml-3">{title}</Text>
    </View>
  );

  // ---- Food search ------------------------------------------------------
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OffResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (phase !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      const r = await searchFoods(q, 20, controller.signal);
      if (!controller.signal.aborted) {
        setResults(r);
        setSearching(false);
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query, phase]);

  // ---- Portion adjust (gram sliders, shared with photo-meal edit) -------
  const [mealName, setMealName] = useState(existing?.name ?? "");
  const [items, setItems] = useState<RecognitionItem[]>(() =>
    (existing?.items ?? []).map(toRecognitionItem),
  );

  const selectFood = (r: OffResult) => {
    setMealName(r.name);
    setItems([
      {
        name: r.name,
        grams: 100,
        caloriesPer100g: r.caloriesPer100g,
        proteinPer100g: r.proteinPer100g,
        carbsPer100g: r.carbsPer100g,
        fatPer100g: r.fatPer100g,
        source: "openfoodfacts",
      },
    ]);
    setPhase("adjust");
  };

  const onChangeGrams = (index: number, grams: number) =>
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, grams: clampGrams(grams) } : it)),
    );

  const onRemoveItem = (index: number) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );

  const onSaveAdjust = () => {
    if (items.length === 0) return;
    const saved: MealItem[] = items.map((it) => ({
      name: it.name,
      grams: it.grams,
      source: it.source,
      ...scalePer100(it, it.grams),
    }));
    const totals = sumNutrition(saved);
    const source: Source = saved.every((it) => it.source === "openfoodfacts")
      ? "openfoodfacts"
      : "gemini_estimate";
    const entry: MealEntry = {
      id: existing?.id ?? newId(),
      name: mealName.trim() || "Meal",
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      servingG: saved.reduce((sum, it) => sum + it.grams, 0),
      source,
      timestamp: existing?.timestamp ?? new Date().toISOString(),
      imageUri: existing?.imageUri,
      items: saved,
    };
    if (existing) updateMeal(date, entry);
    else addMeal(date, entry);
    tapSuccess();
    navigation.goBack();
  };

  // ---- Manual numeric form (fallback / manual-meal edit) ----------------
  const [name, setName] = useState(existing?.name ?? "");
  const [calories, setCalories] = useState(
    editingManual ? String(existing!.calories) : "",
  );
  const [protein, setProtein] = useState(
    editingManual && existing!.protein ? String(existing!.protein) : "",
  );
  const [carbs, setCarbs] = useState(
    editingManual && existing!.carbs ? String(existing!.carbs) : "",
  );
  const [fat, setFat] = useState(
    editingManual && existing!.fat ? String(existing!.fat) : "",
  );

  const kcal = toNum(calories);
  const canSaveManual = kcal > 0;

  const goManual = () => {
    if (!name) setName(query.trim());
    setPhase("manual");
  };

  const onSaveManual = () => {
    if (!canSaveManual) return;
    const entry: MealEntry = {
      id: existing?.id ?? newId(),
      name: name.trim() || "Meal",
      calories: Math.round(kcal),
      protein: toNum(protein),
      carbs: toNum(carbs),
      fat: toNum(fat),
      servingG: existing?.servingG ?? 0,
      source: "manual",
      timestamp: existing?.timestamp ?? new Date().toISOString(),
      imageUri: existing?.imageUri,
      items: undefined, // a hand-typed total has no component breakdown
    };
    if (existing) updateMeal(date, entry);
    else addMeal(date, entry);
    tapSuccess();
    navigation.goBack();
  };

  // ---- Render: portion adjust -------------------------------------------
  if (phase === "adjust") {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        {renderHeader(existing ? undefined : () => setPhase("search"))}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <ResultCard
            name={mealName}
            items={items}
            onChangeGrams={onChangeGrams}
            onRemoveItem={onRemoveItem}
            onSave={onSaveAdjust}
            saveLabel={existing ? "Save changes" : "Add meal"}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- Render: manual numeric form --------------------------------------
  if (phase === "manual") {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        {renderHeader(existing ? undefined : () => setPhase("search"))}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4">
              <Text className="text-textSecondary text-sm font-semibold mb-1.5">
                Name
              </Text>
              <View className="bg-surface2 rounded-xl px-4">
                <TextInput
                  className="text-textPrimary text-base py-3.5"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Flat white"
                  placeholderTextColor={colors.textMuted}
                  autoFocus={!existing}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-textSecondary text-sm font-semibold mb-1.5">
                Calories
              </Text>
              <View className="flex-row items-center bg-surface2 rounded-xl px-4">
                <TextInput
                  className="flex-1 text-textPrimary text-base py-3.5"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <Text className="text-textMuted text-sm ml-2">kcal</Text>
              </View>
            </View>

            <Text className="text-textMuted text-xs mb-3">
              Macros are optional.
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <MacroField
                  label="Protein"
                  color={MACRO_COLORS.protein}
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <View className="flex-1">
                <MacroField
                  label="Carbs"
                  color={MACRO_COLORS.carbs}
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View className="flex-1">
                <MacroField
                  label="Fat"
                  color={MACRO_COLORS.fat}
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>

            <Pressable
              onPress={onSaveManual}
              disabled={!canSaveManual}
              className="flex-row items-center justify-center bg-accent rounded-xl py-4 mt-6 active:opacity-80"
              style={{ opacity: canSaveManual ? 1 : 0.5 }}
            >
              <Check color={colors.onAccent} size={18} strokeWidth={2.5} />
              <Text className="text-onAccent font-bold ml-2">
                {existing ? "Save changes" : "Add meal"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---- Render: food search ----------------------------------------------
  const showEmpty =
    query.trim().length >= 2 && !searching && results.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {renderHeader()}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-5 pt-2 pb-3">
          <View className="flex-row items-center bg-surface2 rounded-xl px-4">
            <Search color={colors.textMuted} size={18} />
            <TextInput
              className="flex-1 text-textPrimary text-base py-3.5 ml-2"
              value={query}
              onChangeText={setQuery}
              placeholder="Search a food, e.g. banana"
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
            />
            {searching ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : null}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {results.map((r, i) => (
            <Pressable
              key={`${r.name}-${i}`}
              onPress={() => selectFood(r)}
              className="bg-surface rounded-2xl px-4 py-3 mb-2 active:opacity-70"
            >
              <Text className="text-textPrimary font-semibold" numberOfLines={1}>
                {r.name}
              </Text>
              {r.brand ? (
                <Text className="text-textMuted text-xs mt-0.5" numberOfLines={1}>
                  {r.brand}
                </Text>
              ) : null}
              <Text className="text-textSecondary text-xs mt-1">
                {Math.round(r.caloriesPer100g)} kcal · P{" "}
                {Math.round(r.proteinPer100g)} · C {Math.round(r.carbsPer100g)} · F{" "}
                {Math.round(r.fatPer100g)}
                <Text className="text-textMuted"> / 100g</Text>
              </Text>
            </Pressable>
          ))}

          {showEmpty ? (
            <Text className="text-textMuted text-center mt-6">
              No matches for “{query.trim()}”.
            </Text>
          ) : null}

          {query.trim().length < 2 ? (
            <Text className="text-textMuted text-sm text-center mt-6">
              Type at least 2 letters to search Open Food Facts.
            </Text>
          ) : null}

          <Pressable
            onPress={goManual}
            className="flex-row items-center justify-center mt-6 active:opacity-70"
            hitSlop={8}
          >
            <Pencil color={colors.textSecondary} size={16} />
            <Text className="text-textSecondary font-semibold ml-2">
              Enter values manually
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroField({
  label,
  color,
  value,
  onChangeText,
}: {
  label: string;
  color: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View>
      <View className="flex-row items-center mb-1.5">
        <View
          className="w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        />
        <Text className="text-textSecondary text-sm font-semibold">{label}</Text>
      </View>
      <View className="flex-row items-center bg-surface2 rounded-xl px-3">
        <TextInput
          className="flex-1 text-textPrimary text-base py-3.5"
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        <Text className="text-textMuted text-xs ml-1">g</Text>
      </View>
    </View>
  );
}
