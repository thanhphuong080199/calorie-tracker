import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserSettings } from "@/types";

export const DEFAULT_SETTINGS: UserSettings = {
  dailyCalorieTarget: 2000,
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
