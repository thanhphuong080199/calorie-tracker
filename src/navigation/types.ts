import { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  EditProfile: { edit?: boolean } | undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Scan: undefined;
  MealDetail: { date: string; mealId: string };
  /** Add a meal by hand (no mealId) or edit an existing one (with mealId). */
  ManualEntry: { date: string; mealId?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
