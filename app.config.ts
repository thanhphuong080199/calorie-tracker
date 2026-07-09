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
  userInterfaceStyle: "light",
  backgroundColor: "#F5F7F1",
  // OTA updates (EAS Update). The runtime fingerprint changes whenever native
  // code/deps change, so a JS-only OTA is only delivered to builds whose native
  // layer matches — a native change requires a fresh APK build.
  runtimeVersion: {
    policy: "fingerprint",
  },
  updates: {
    url: "https://u.expo.dev/98e7d9a4-4a01-4ddc-bfab-3ce4767ea0bc",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#F5F7F1",
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
        backgroundColor: "#F5F7F1",
      },
    ],
    "expo-font",
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
    "expo-notifications",
  ],
  extra: {
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    eas: { projectId: "98e7d9a4-4a01-4ddc-bfab-3ce4767ea0bc" },
  },
});
