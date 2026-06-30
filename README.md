# calorie-tracker

AI-powered calorie tracker for Android. Photo-based food recognition via Gemini API, adjustable portions, daily calorie goal tracking — built with React Native & Expo, no backend required.

## Stack

- Expo SDK 54 (React Native 0.81, React 19), TypeScript
- NativeWind v4 (Tailwind) for styling — dark theme
- React Navigation (bottom tabs + modal stack)
- Zustand + AsyncStorage for state & local persistence (offline-capable)
- Expo Camera / Image Picker for meal photos
- Gemini Vision (food recognition) + Open Food Facts (nutrition lookup)
- lucide-react-native icons, react-native-svg charts

## Setup

```bash
npm install
cp .env.example .env   # then add your Gemini key
```

Get a free Gemini key at https://aistudio.google.com/apikey and set it in `.env`:

```
GEMINI_API_KEY=your_key_here
```

## Run

```bash
npm run android      # open on a connected device / emulator (Expo Go or dev build)
npm start            # start Metro, then scan the QR with Expo Go
```

> Camera requires a real device or a dev build (Expo Go on a physical phone works).

## Project layout

```
src/
  navigation/   bottom tabs + Scan modal
  screens/      Home, Scan, Settings
  components/    UI pieces (ring chart, macro bar, meal rows, result card)
  store/        zustand stores (logs, settings) persisted to AsyncStorage
  services/     gemini, openFoodFacts, recognition orchestrator
  utils/        date, nutrition scaling, ids
  theme/        color palette (mirrors tailwind.config.js)
  types/        shared TypeScript models
```

## Build a shareable APK (EAS)

The `preview` profile in `eas.json` produces a standalone **APK** you can send to
any Android phone (no Play Store needed).

```bash
npm i -g eas-cli         # or use npx eas-cli@latest below
eas login                # log in to your Expo account
eas init                 # creates the EAS project; paste the printed
                         # projectId into app.config.ts -> extra.eas.projectId
```

**Provide the Gemini key to the cloud build.** `.env` is gitignored and is *not*
uploaded, so set the key as an EAS environment variable (encrypted) for the
profiles you build:

```bash
eas env:create --name GEMINI_API_KEY --value "<your_key>" --visibility secret --environment preview
eas env:create --name GEMINI_API_KEY --value "<your_key>" --visibility secret --environment production
```

`app.config.ts` reads `process.env.GEMINI_API_KEY` at build time, so the value
flows into `extra.geminiApiKey` automatically.

Then build:

```bash
eas build -p android --profile preview
```

EAS returns a download link for the `.apk` when the build finishes. Install it by
opening the link on the phone (allow "install from unknown sources").

> A standalone build compiles native modules to match the JS exactly, so the
> Reanimated/Expo-Go limitation doesn't apply here — but the app currently uses
> no runtime Reanimated anyway.
