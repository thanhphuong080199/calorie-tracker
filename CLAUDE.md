# Calorie Tracker

Expo / React Native (SDK 54) app: photograph a meal → recognize it → log calories. TypeScript, NativeWind, Zustand.

## Commands
```bash
npm start          # Expo dev server (then press a / i, or scan QR)
npm run android    # open on Android
npm run ios        # open on iOS
```
No test/lint scripts yet. Type-check with `npx tsc --noEmit`.

## Environment
- Copy `.env.example` → `.env`, set `GEMINI_API_KEY` (free key: https://aistudio.google.com/apikey).
- The key is surfaced to the app via `app.config.ts` `extra.geminiApiKey` and read with `expo-constants` (`getGeminiApiKey()`), **not** as `EXPO_PUBLIC_*` — keep it that way to keep it out of the JS bundle. Restart the dev server after changing `.env`.

## Architecture
- `src/services/recognitionService.ts` — the pipeline: `identifyMeal` (Gemini Vision splits the photo into food components with per-100g nutrition) → per-component Open Food Facts lookup in parallel. OFF nutrition wins when it has calories (`source: openfoodfacts`); otherwise Gemini's estimate is kept (`source: gemini_estimate`). Gemini failure is fatal; OFF misses are non-fatal.
- `src/services/geminiService.ts` — model is pinned to `gemini-2.5-flash` (2.0-flash lost its free tier and returns 429 "limit: 0"). Uses structured-output schema + `thinkingBudget: 0`. 429s auto-retry using Gemini's RetryInfo delay (≤20s, 3 attempts).
- `src/store/logStore.ts` / `settingsStore.ts` — Zustand + `persist` to AsyncStorage (`ct-logs`, settings). Logs keyed by `YYYY-MM-DD`. `App.tsx` gates the first paint on both stores' `_hydrated` flags + fonts.
- `src/navigation/RootNavigator.tsx` — stack (Tabs + modal `Scan`) over a bottom tab bar (Home, Settings).
- `src/utils/image.ts` — only a ~200px thumbnail is persisted per meal (`{id}.jpg` in the document dir, ~15 KB), never the full-res original; deletes are best-effort.

## Conventions
- `@/*` path alias → `src/*` (`tsconfig.json`). TypeScript `strict` is on.
- `babel.config.js`: `react-native-worklets/plugin` must be listed **last** (Reanimated v4 ships its worklets plugin there). NativeWind via `jsxImportSource` + `nativewind/babel` presets.
- Product: the **calorie ring is the Home hero** — this is an info-first tracker, not a meal diary.

## CI / builds
Push to `main` → `.github/workflows/eas-build.yml` triggers an EAS preview APK build (`--no-wait`; watch at expo.dev). `GEMINI_API_KEY` comes from the EAS "preview" environment (see `eas.json`). Needs `EXPO_TOKEN` secret.
