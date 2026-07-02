import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { House, Settings as SettingsIcon } from "lucide-react-native";
import { RootStackParamList, TabParamList } from "./types";
import { colors } from "@/theme/colors";
import { useSettingsStore } from "@/store/settingsStore";
import HomeScreen from "@/screens/HomeScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ScanScreen from "@/screens/ScanScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const onboarded = useSettingsStore((s) => s.onboarded);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded ? (
        // First launch: collect the TDEE profile before the app proper. Once
        // `onboarded` flips, this screen unmounts and Tabs becomes the root.
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          {/* Reused for editing the profile / recalculating from Settings.
              A distinct route name (not "Onboarding") matters: it means the
              first-launch Onboarding screen truly unmounts once `onboarded`
              flips, so the navigator advances to the tabs instead of staying
              put on a same-named screen. */}
          <Stack.Screen
            name="EditProfile"
            component={OnboardingScreen}
            initialParams={{ edit: true }}
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
