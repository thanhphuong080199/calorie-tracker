# Roadmap

Ideas and planned work for Calorie Tracker. The core loop (photo → recognize →
log against a TDEE goal) is feature-complete; everything here is enhancement.

Status legend: 🟢 done · 🟡 in progress · ⚪ not started

## High value, low effort

- 🟢 **Edit a saved meal** — MealDetail → pencil opens `ManualEntryScreen`. Photo
  meals (with a component breakdown) reuse the Scan gram-slider editor
  (`ResultCard`, now with optional confidence/retake); manual/no-breakdown meals
  use a numeric form. `logStore.updateMeal` replaces the entry in place.
- 🟢 **Quick-add via food search** — "Add food" on Home (today) opens a search
  box; live Open Food Facts search (`searchFoods`, debounced) fills
  calories/macros. Pick a result → adjust grams → save (`source:
  "openfoodfacts"`). Fallback "Enter values manually" numeric form for foods not
  in the database (`source: "manual"`, shown as "Entered manually"). Same
  `ManualEntryScreen`.
- 🟢 **Haptics** — `utils/haptics.ts` wraps `expo-haptics`: light tap on FAB /
  add-manually, success buzz on save (scan + manual), warning buzz on delete.

## High value, medium effort

- 🟢 **History / trends view** — Insights tab (`InsightsScreen`) with a
  Weekly/Monthly/Yearly segmented control + period stepper. Calorie chart
  (`CalorieTrendChart`, tappable bar **or** line/area variants) plots average
  daily kcal per bucket against a dashed daily-goal line with a selected-bucket
  callout; average-vs-goal summary underneath. `MacroStackChart` shows the
  carbs/protein/fat energy split as 100%-stacked bars. `utils/trends.ts`
  buckets the persisted logs (7 days / weeks-of-month / 12 months).
- ⚪ **Recent / favorite meals** — one-tap re-log of frequently eaten meals.
  Derive candidates from persisted `MealEntry` history.
- ⚪ **Water tracking** — tappable counter on Home. Low complexity.

## Higher effort / more ambitious

- ⚪ **Barcode scanning** — scan a packaged product's barcode → exact nutrition.
  Natural extension: Open Food Facts is already the nutrition source and is
  barcode-native.
- 🟢 **Meal reminders** — onboarding gains a "When do you usually eat?" step
  (`MealTimesEditor` + `TimePicker`) that captures breakfast/lunch/dinner times
  (`settings.mealTimes`). `services/notificationService.ts` schedules a daily
  repeating local notification per meal via `expo-notifications`; `App.tsx`
  reconciles the OS schedule on launch. A Settings "Reminders" toggle
  (`remindersEnabled`) requests permission and lets the times be edited later.

## Done

- 🟢 Photo → Gemini multi-component recognition → Open Food Facts nutrition → log
- 🟢 TDEE onboarding wizard with personalized calorie/macro plan
- 🟢 Meal detail view, macro rings, branded app icons
- 🟢 CI: push to `main` → EAS preview APK build
