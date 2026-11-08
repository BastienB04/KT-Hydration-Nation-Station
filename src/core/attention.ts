/**
 * Whether the latest reminder is still waiting for a sip. Drives the tray
 * "due" icon and Ribbit's reminder pose. Pure; no Tauri, no DOM.
 */
import type { PersistedData } from "./schema";
import { evaluate } from "./scheduler";
import { dateKeyOf, parseIso } from "./time";

/**
 * True when setup is done, a reminder fired today after the last drink (or
 * with no drink logged), and the scheduler is still waiting or due, so
 * pauses, goal-met and quiet hours clear it.
 */
export function reminderUnanswered(data: PersistedData, now: number): boolean {
  if (!data.settings.setupDone) return false;
  const reminderAt = parseIso(data.state.lastReminderAt);
  if (reminderAt === null || dateKeyOf(reminderAt) !== dateKeyOf(now)) return false;
  const drinkAt = parseIso(data.state.lastDrinkAt);
  if (drinkAt !== null && drinkAt >= reminderAt) return false;
  const kind = evaluate(data, now).kind;
  return kind === "waiting" || kind === "due";
}
