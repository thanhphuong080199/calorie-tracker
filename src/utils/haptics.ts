// Thin wrappers over expo-haptics so call sites read intent-first and failures
// (e.g. no vibration motor, or web) never bubble up — haptics are pure polish.
import * as Haptics from "expo-haptics";

/** Light tap — buttons, FAB, minor confirmations. */
export function tapLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Success buzz — a meal was logged / saved. */
export function tapSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

/** Warning buzz — destructive actions like deleting a meal. */
export function tapWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {},
  );
}
