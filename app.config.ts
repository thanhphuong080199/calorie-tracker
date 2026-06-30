import { ExpoConfig, ConfigContext } from "expo/config";

// Expo loads .env into process.env when this config is evaluated, so we can
// surface GEMINI_API_KEY to the app via `extra` (read at runtime through
// expo-constants in src/services/geminiService.ts). The key is NOT prefixed
// EXPO_PUBLIC_, keeping it out of the JS bundle's global process.env shim.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Calorie Tracker",
  slug: "calorie-tracker",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#0F0F0F",
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0F0F0F",
      foregroundImage: "./assets/android-icon-foreground.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.calorietracker.app",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0F0F0F",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Calorie Tracker uses the camera to photograph your meals for nutrition analysis.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Calorie Tracker accesses your photos so you can pick a meal image to analyze.",
      },
    ],
  ],
  extra: {
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    // After running `eas init`, paste the printed project id here:
    // eas: { projectId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  },
});
