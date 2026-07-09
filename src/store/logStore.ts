import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog, MealEntry } from "@/types";
import { useSettingsStore, DEFAULT_SETTINGS } from "./settingsStore";
import { deleteThumbnail } from "@/utils/image";

interface LogState {
  /** Logs keyed by YYYY-MM-DD for O(1) lookup. */
  logs: Record<string, DailyLog>;
  _hydrated: boolean;

  getLog: (date: string) => DailyLog | undefined;
  addMeal: (date: string, meal: MealEntry) => void;
  /** Replace an existing meal (matched by id) in place, keeping its position. */
  updateMeal: (date: string, meal: MealEntry) => void;
  deleteMeal: (date: string, mealId: string) => void;
  clearDay: (date: string) => void;
  /** Set of dates that have at least one meal — used for streaks. */
  loggedDates: () => Set<string>;
}

function emptyLog(date: string): DailyLog {
  // Snapshot the current target so historical days keep their goal.
  const target =
    useSettingsStore.getState()?.dailyCalorieTarget ??
    DEFAULT_SETTINGS.dailyCalorieTarget;
  return { date, meals: [], calorieTarget: target };
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: {},
      _hydrated: false,

      getLog: (date) => get().logs[date],

      addMeal: (date, meal) =>
        set((state) => {
          const existing = state.logs[date] ?? emptyLog(date);
          return {
            logs: {
              ...state.logs,
              [date]: { ...existing, meals: [...existing.meals, meal] },
            },
          };
        }),

      updateMeal: (date, meal) =>
        set((state) => {
          const existing = state.logs[date];
          if (!existing) return state;
          return {
            logs: {
              ...state.logs,
              [date]: {
                ...existing,
                meals: existing.meals.map((m) => (m.id === meal.id ? meal : m)),
              },
            },
          };
        }),

      deleteMeal: (date, mealId) =>
        set((state) => {
          const existing = state.logs[date];
          if (!existing) return state;
          deleteThumbnail(existing.meals.find((m) => m.id === mealId)?.imageUri);
          return {
            logs: {
              ...state.logs,
              [date]: {
                ...existing,
                meals: existing.meals.filter((m) => m.id !== mealId),
              },
            },
          };
        }),

      clearDay: (date) =>
        set((state) => {
          const existing = state.logs[date];
          if (!existing) return state;
          existing.meals.forEach((m) => deleteThumbnail(m.imageUri));
          return {
            logs: { ...state.logs, [date]: { ...existing, meals: [] } },
          };
        }),

      loggedDates: () => {
        const { logs } = get();
        return new Set(
          Object.keys(logs).filter((d) => logs[d].meals.length > 0),
        );
      },
    }),
    {
      name: "ct-logs",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ logs }) => ({ logs }),
      onRehydrateStorage: () => () => {
        useLogStore.setState({ _hydrated: true });
      },
    },
  ),
);
