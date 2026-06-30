import "./global.css";
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DarkTheme,
  Theme,
} from "@react-navigation/native";
import RootNavigator from "@/navigation/RootNavigator";
import { useLogStore } from "@/store/logStore";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    primary: colors.accent,
    text: colors.textPrimary,
  },
};

export default function App() {
  // Gate render until both persisted stores have hydrated from AsyncStorage,
  // so the first paint reflects saved data instead of defaults flashing.
  const settingsReady = useSettingsStore((s) => s._hydrated);
  const logsReady = useLogStore((s) => s._hydrated);
  const ready = settingsReady && logsReady;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {ready ? (
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
