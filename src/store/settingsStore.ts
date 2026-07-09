import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserSettings, TdeeProfile, MealTimes } from "@/types";
import { calorieTarget, macroTargets } from "@/utils/tdee";
import { DEFAULT_MEAL_TIMES } from "@/utils/time";

export const DEFAULT_SETTINGS: UserSettings = {
  dailyCalorieTarget: 2000,
  onboarded: false,
  mealTimes: DEFAULT_MEAL_TIMES,
  remindersEnabled: false,
};

interface SettingsState extends UserSettings {
  /** Track hydration so the UI can wait for AsyncStorage before rendering. */
  _hydrated: boolean;
  setDailyCalorieTarget: (kcal: number) => void;
  setMacroTargets: (m: {
    proteinTarget?: number;
    carbsTarget?: number;
    fatTarget?: number;
  }) => void;
  /**
   * Save the TDEE profile and derive the calorie + macro targets from it in one
   * step, marking the user onboarded. Called from the onboarding flow.
   */
  setProfile: (profile: TdeeProfile) => void;
  setMealTimes: (mealTimes: MealTimes) => void;
  setRemindersEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      _hydrated: false,
      setDailyCalorieTarget: (kcal) =>
        set({ dailyCalorieTarget: Math.max(0, Math.round(kcal)) }),
      setMacroTargets: (m) =>
        set({
          proteinTarget: m.proteinTarget,
          carbsTarget: m.carbsTarget,
          fatTarget: m.fatTarget,
        }),
      setProfile: (profile) => {
        const dailyCalorieTarget = calorieTarget(profile);
        const macros = macroTargets(dailyCalorieTarget, profile.dietType);
        set({
          profile,
          dailyCalorieTarget,
          proteinTarget: macros.proteinTarget,
          carbsTarget: macros.carbsTarget,
          fatTarget: macros.fatTarget,
          onboarded: true,
        });
      },
      setMealTimes: (mealTimes) => set({ mealTimes }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
    }),
    {
      name: "ct-settings",
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist the hydration flag.
      partialize: ({ _hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        // Runs after AsyncStorage resolves; the store exists by now.
        useSettingsStore.setState({ _hydrated: true });
      },
    },
  ),
);
