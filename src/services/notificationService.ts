// Local (on-device) daily meal reminders. No server / push token involved — we
// schedule repeating calendar notifications at the user's meal times and let the
// OS fire them. Rescheduled whenever the times, the enable flag, or app launch
// changes, so the schedule always matches settings.

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { MealTimes, MealKey } from "@/types";
import { MEAL_META, parseHM } from "@/utils/time";

const CHANNEL_ID = "meal-reminders";

const COPY: Record<MealKey, { title: string; body: string }> = {
  breakfast: {
    title: "🍳 Breakfast time",
    body: "Snap your meal to log it and start the day on track.",
  },
  lunch: {
    title: "🥗 Lunch time",
    body: "Don't forget to log your lunch.",
  },
  dinner: {
    title: "🍽️ Dinner time",
    body: "Log your dinner to keep your streak alive.",
  },
};

/** Foreground presentation. Safe to call more than once. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Meal reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

/**
 * Ask for notification permission if not already decided. Returns whether it's
 * granted. Called before we first enable reminders.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Clear every reminder we've scheduled. */
export async function cancelMealReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Reschedule the daily reminders to match settings. When disabled (or no
 * permission), it simply clears any existing ones. Idempotent — cancels first,
 * then schedules, so calling it repeatedly is safe.
 */
export async function syncMealReminders(
  mealTimes: MealTimes,
  enabled: boolean,
): Promise<void> {
  try {
    await cancelMealReminders();
    if (!enabled) return;

    const granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) return;

    await ensureAndroidChannel();

    for (const key of Object.keys(MEAL_META) as MealKey[]) {
      const { hour, minute } = parseHM(mealTimes[key]);
      await Notifications.scheduleNotificationAsync({
        content: { ...COPY[key] },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // Notifications are a best-effort enhancement; never let them crash the app
    // (e.g. running in an environment without the native module).
  }
}
