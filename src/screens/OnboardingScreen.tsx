import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Check } from "lucide-react-native";
import { RootStackParamList } from "@/navigation/types";
import { useSettingsStore } from "@/store/settingsStore";
import {
  ActivityLevel,
  DietType,
  MainGoal,
  Sex,
  TdeeProfile,
} from "@/types";
import {
  ACTIVITY_LABELS,
  ACTIVITY_ORDER,
  DIET_LABELS,
  DIET_MACROS,
  DIET_ORDER,
  GOAL_LABELS,
  GOAL_ORDER,
  calorieTarget,
  macroTargets,
} from "@/utils/tdee";
import { colors } from "@/theme/colors";
import RulerPicker from "@/components/RulerPicker";
import WheelPicker from "@/components/WheelPicker";
import MacroDonut, { MACRO_COLORS } from "@/components/MacroDonut";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INPUT_STEPS = [
  "name",
  "gender",
  "birthday",
  "height",
  "weight",
  "target",
  "goal",
  "activity",
  "diet",
] as const;
const LOADING_STEP = INPUT_STEPS.length; // 9
const PLAN_STEP = LOADING_STEP + 1; // 10

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const pad2 = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const NOW = new Date();
const MIN_YEAR = NOW.getFullYear() - 90;
const MAX_YEAR = NOW.getFullYear() - 13;
const YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i,
);

function ageFrom(year: number, month: number, day: number): number {
  let age = NOW.getFullYear() - year;
  if (
    NOW.getMonth() < month ||
    (NOW.getMonth() === month && NOW.getDate() < day)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

/** A selectable emoji + title row used by the goal / activity / diet steps. */
function OptionRow({
  emoji,
  title,
  active,
  onPress,
}: {
  emoji: string;
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-2xl px-4 py-3.5 mb-2.5 border ${
        active ? "bg-accent/10 border-accent" : "bg-surface border-border"
      }`}
    >
      <Text style={{ fontSize: 20 }} className="mr-3">
        {emoji}
      </Text>
      <Text
        className={`flex-1 text-base ${
          active ? "text-textPrimary font-bold" : "text-textPrimary"
        }`}
      >
        {title}
      </Text>
      {active ? (
        <View className="w-6 h-6 rounded-full bg-accent items-center justify-center">
          <Check color={colors.onAccent} size={15} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const isEdit = (route.params as { edit?: boolean } | undefined)?.edit === true;

  const setProfile = useSettingsStore((s) => s.setProfile);
  const existing = useSettingsStore((s) => s.profile);

  const [step, setStep] = useState(0);

  // --- form state (prefilled from an existing profile when editing) ---
  const [name, setName] = useState(existing?.name ?? "");
  const [sex, setSex] = useState<Sex>(existing?.sex ?? "male");

  const startAge = existing?.age ?? 30;
  const [year, setYear] = useState(NOW.getFullYear() - startAge);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(15);

  const [heightCm, setHeightCm] = useState(existing?.heightCm ?? 170);
  const [weightKg, setWeightKg] = useState(existing?.weightKg ?? 70);
  const [targetKg, setTargetKg] = useState(
    existing?.targetWeightKg ?? existing?.weightKg ?? 70,
  );
  const [goals, setGoals] = useState<MainGoal[]>(existing?.goals ?? []);
  const toggleGoal = (g: MainGoal) =>
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  const [activity, setActivity] = useState<ActivityLevel>(
    existing?.activityLevel ?? "sedentary",
  );
  const [diet, setDiet] = useState<DietType>(existing?.dietType ?? "balanced");

  const dayCount = daysInMonth(year, month);
  const clampedDay = Math.min(day, dayCount);

  const profile = useMemo<TdeeProfile>(
    () => ({
      name: name.trim() || undefined,
      sex,
      age: ageFrom(year, month, clampedDay),
      heightCm,
      weightKg,
      targetWeightKg: targetKg,
      activityLevel: activity,
      goals,
      dietType: diet,
    }),
    [
      name, sex, year, month, clampedDay, heightCm, weightKg, targetKg,
      activity, goals, diet,
    ],
  );

  const calories = calorieTarget(profile);
  const macros = macroTargets(calories, diet);

  // The "Personalizing…" step auto-advances to the plan after a beat.
  useEffect(() => {
    if (step !== LOADING_STEP) return;
    const id = setTimeout(() => setStep(PLAN_STEP), 1600);
    return () => clearTimeout(id);
  }, [step]);

  const onBack = () => {
    if (step > 0 && step < LOADING_STEP) setStep(step - 1);
    else if (isEdit) navigation.goBack();
  };

  const onContinue = () => {
    if (step < LOADING_STEP - 1) setStep(step + 1);
    else if (step === LOADING_STEP - 1) setStep(LOADING_STEP); // dinner → loading
  };

  const onFinish = () => {
    setProfile(profile);
    if (isEdit) navigation.goBack();
    // First launch: flipping `onboarded` swaps the navigator to the tabs.
  };

  const showBack = (step > 0 && step < LOADING_STEP) || (isEdit && step === 0);
  const progress = step < LOADING_STEP ? (step + 1) / INPUT_STEPS.length : 1;
  // The goal step needs at least one pick before advancing.
  const continueDisabled = step === 6 && goals.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Header: back + progress + step count */}
      {step < LOADING_STEP ? (
        <View className="flex-row items-center px-5 pt-2 pb-4">
          {showBack ? (
            <Pressable onPress={onBack} hitSlop={10} className="mr-3">
              <ArrowLeft color={colors.textPrimary} size={24} />
            </Pressable>
          ) : (
            <View className="w-6 mr-3" />
          )}
          <View className="flex-1 h-2 rounded-full bg-surface2 overflow-hidden">
            <View
              className="h-2 rounded-full bg-accent"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          <Text className="text-textMuted text-sm ml-3">
            {step + 1} / {INPUT_STEPS.length}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ------------------------------ NAME ------------------------------ */}
        {step === 0 && (
          <View className="flex-1 justify-center">
            <Text className="text-textPrimary text-3xl font-display text-center mb-8">
              What's your name?
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-2xl text-textPrimary text-2xl text-center py-5"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        )}

        {/* ----------------------------- GENDER ----------------------------- */}
        {step === 1 && (
          <View className="flex-1 justify-center">
            <Text className="text-textPrimary text-3xl font-display text-center mb-10">
              What's your gender?
            </Text>
            <View className="flex-row justify-center gap-6 mb-6">
              {(["male", "female"] as Sex[]).map((s) => {
                const active = sex === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSex(s)}
                    className="items-center"
                  >
                    <View
                      className={`w-24 h-24 rounded-full items-center justify-center border-2 ${
                        active ? "bg-accent border-accent" : "bg-surface border-border"
                      }`}
                    >
                      <Text style={{ fontSize: 38 }}>
                        {s === "male" ? "♂" : "♀"}
                      </Text>
                    </View>
                    <Text
                      className={`mt-2 ${
                        active ? "text-accent font-bold" : "text-textSecondary"
                      }`}
                    >
                      {s === "male" ? "Male" : "Female"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setSex("unspecified")}
              className={`self-center px-5 py-2.5 rounded-full border ${
                sex === "unspecified"
                  ? "bg-accent/10 border-accent"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={
                  sex === "unspecified"
                    ? "text-textPrimary font-semibold"
                    : "text-textSecondary"
                }
              >
                Prefer not to say
              </Text>
            </Pressable>
          </View>
        )}

        {/* ---------------------------- BIRTHDAY ---------------------------- */}
        {step === 2 && (
          <View className="flex-1 justify-center">
            <Text className="text-textPrimary text-3xl font-display text-center mb-8">
              When's your birthday?
            </Text>
            <View className="flex-row justify-center">
              <WheelPicker
                items={MONTHS}
                selectedIndex={month}
                onChange={setMonth}
                width={90}
              />
              <WheelPicker
                key={`day-${month}-${year}`}
                items={Array.from({ length: dayCount }, (_, i) => pad2(i + 1))}
                selectedIndex={clampedDay - 1}
                onChange={(i) => setDay(i + 1)}
                width={70}
              />
              <WheelPicker
                items={YEARS}
                selectedIndex={year - MIN_YEAR}
                onChange={(i) => setYear(YEARS[i])}
                width={90}
              />
            </View>
            <Text className="text-textMuted text-center mt-6">
              {ageFrom(year, month, clampedDay)} years old
            </Text>
          </View>
        )}

        {/* ----------------------------- HEIGHT ----------------------------- */}
        {step === 3 && (
          <View className="flex-1 justify-center">
            <Text className="text-textPrimary text-3xl font-display text-center mb-10">
              How tall are you?
            </Text>
            <RulerPicker
              min={120}
              max={220}
              step={1}
              value={heightCm}
              onChange={setHeightCm}
              unit="cm"
            />
          </View>
        )}

        {/* ---------------------------- WEIGHT ------------------------------ */}
        {step === 4 && (
          <View className="flex-1 justify-center">
            <Text className="text-textPrimary text-3xl font-display text-center mb-10">
              What's your current weight?
            </Text>
            <RulerPicker
              min={30}
              max={200}
              step={0.5}
              value={weightKg}
              onChange={setWeightKg}
              unit="kg"
              majorEvery={20}
            />
          </View>
        )}

        {/* ------------------------- TARGET WEIGHT -------------------------- */}
        {step === 5 && (
          <View className="flex-1 justify-center">
            <Text className="text-textPrimary text-3xl font-display text-center mb-10">
              What's your target weight?
            </Text>
            <RulerPicker
              min={30}
              max={200}
              step={0.5}
              value={targetKg}
              onChange={setTargetKg}
              unit="kg"
              majorEvery={20}
            />
          </View>
        )}

        {/* ------------------------------ GOAL ------------------------------ */}
        {step === 6 && (
          <View className="flex-1 justify-center py-6">
            <Text className="text-textPrimary text-3xl font-display text-center mb-1">
              What are your goals?
            </Text>
            <Text className="text-textMuted text-center mb-7">
              Choose one or more.
            </Text>
            {GOAL_ORDER.map((g) => (
              <OptionRow
                key={g}
                emoji={GOAL_LABELS[g].emoji}
                title={GOAL_LABELS[g].title}
                active={goals.includes(g)}
                onPress={() => toggleGoal(g)}
              />
            ))}
          </View>
        )}

        {/* ---------------------------- ACTIVITY ---------------------------- */}
        {step === 7 && (
          <View className="flex-1 justify-center py-6">
            <Text className="text-textPrimary text-3xl font-display text-center mb-8">
              What's your activity level?
            </Text>
            {ACTIVITY_ORDER.map((a) => (
              <OptionRow
                key={a}
                emoji={ACTIVITY_LABELS[a].emoji}
                title={ACTIVITY_LABELS[a].title}
                active={activity === a}
                onPress={() => setActivity(a)}
              />
            ))}
          </View>
        )}

        {/* ------------------------------ DIET ------------------------------ */}
        {step === 8 && (
          <View className="flex-1 justify-center py-6">
            <Text className="text-textPrimary text-3xl font-display text-center mb-8">
              What's your diet type?
            </Text>
            {DIET_ORDER.map((d) => (
              <OptionRow
                key={d}
                emoji={DIET_LABELS[d].emoji}
                title={DIET_LABELS[d].title}
                active={diet === d}
                onPress={() => setDiet(d)}
              />
            ))}
          </View>
        )}

        {/* --------------------------- PERSONALIZING ------------------------ */}
        {step === LOADING_STEP && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="text-textPrimary text-2xl font-display text-center mt-8">
              Personalizing your plan…
            </Text>
            <Text className="text-textMuted text-center mt-2">
              Hang tight! We're crafting a plan just for you.
            </Text>
          </View>
        )}

        {/* ------------------------------ PLAN ------------------------------ */}
        {step === PLAN_STEP && (
          <View className="flex-1 items-center justify-center py-6">
            <Text className="text-textPrimary text-2xl font-display text-center mb-8">
              Your personalized calorie{"\n"}plan is ready!
            </Text>
            <MacroDonut
              calories={calories}
              macros={{
                carbs: macros.carbsTarget,
                protein: macros.proteinTarget,
                fat: macros.fatTarget,
              }}
            />
            <View className="flex-row justify-between w-full mt-8 px-2">
              {([
                ["Carbs", macros.carbsTarget, MACRO_COLORS.carbs, 4],
                ["Protein", macros.proteinTarget, MACRO_COLORS.protein, 4],
                ["Fat", macros.fatTarget, MACRO_COLORS.fat, 9],
              ] as const).map(([label, grams, color, kcalPerG]) => (
                <View key={label} className="items-center flex-1">
                  <View className="flex-row items-center mb-1">
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-1.5"
                      style={{ backgroundColor: color }}
                    />
                    <Text className="text-textSecondary text-sm">{label}</Text>
                  </View>
                  <Text
                    className="text-textPrimary text-lg font-display"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {grams} g
                  </Text>
                  <Text className="text-textMuted text-xs">
                    {Math.round(((grams * kcalPerG) / calories) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
      {step < LOADING_STEP ? (
        <View className="px-6 pb-2 pt-2">
          <Pressable
            onPress={onContinue}
            disabled={continueDisabled}
            className="bg-accent rounded-full py-4 items-center active:opacity-80"
            style={{ opacity: continueDisabled ? 0.4 : 1 }}
          >
            <Text className="text-onAccent font-bold text-base">
              {step === LOADING_STEP - 1 ? "Finish" : "Continue"}
            </Text>
          </Pressable>
        </View>
      ) : step === PLAN_STEP ? (
        <View className="px-6 pb-2 pt-2">
          <Pressable
            onPress={onFinish}
            className="bg-accent rounded-full py-4 items-center active:opacity-80"
          >
            <Text className="text-onAccent font-bold text-base">
              Start Your Plan Now
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
