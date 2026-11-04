/**
 * Reminder scheduling (Requirements 4.5). Pure and timestamp-based: given the
 * persisted data and `now`, it returns a decision. The 30-second tick only
 * affects latency, never correctness. No Tauri, no DOM.
 */
import type { PersistedData, Settings } from "./schema";
import { todayTotal } from "./stats";
import { atLocalMinutes, isoWeekday, nextLocalMidnight, parseHHMM, parseIso } from "./time";

export type Decision =
  | { kind: "setup-incomplete" }
  | { kind: "paused"; until: number }
  | { kind: "inactive-day" }
  | { kind: "outside-hours" }
  | { kind: "goal-met" }
  | { kind: "waiting"; dueAt: number | null }
  | { kind: "due" };

/** The `[start, end)` active window on `now`'s local day, in epoch ms. */
export function activeWindow(settings: Settings, now: number): { start: number; end: number } {
  const startMin = parseHHMM(settings.activeHours.start) ?? 480;
  const endMin = parseHHMM(settings.activeHours.end) ?? 1320;
  return { start: atLocalMinutes(now, startMin), end: atLocalMinutes(now, endMin) };
}

/** Pause target for "rest of day": today's active end, or next midnight if already past it. */
export function restOfDayUntil(settings: Settings, now: number): number {
  const { end } = activeWindow(settings, now);
  return now < end ? end : nextLocalMidnight(now);
}

export function evaluate(data: PersistedData, now: number): Decision {
  const { settings, state } = data;

  if (!settings.setupDone) return { kind: "setup-incomplete" };

  const pausedUntil = parseIso(state.pausedUntil);
  if (pausedUntil !== null && now < pausedUntil) {
    return { kind: "paused", until: pausedUntil };
  }

  if (!settings.activeDays.includes(isoWeekday(now))) return { kind: "inactive-day" };

  const { start, end } = activeWindow(settings, now);
  if (now < start || now >= end) return { kind: "outside-hours" };

  if (todayTotal(data.log, now) >= settings.dailyGoalMl) return { kind: "goal-met" };

  // Anchor = latest of last drink, last reminder and the active start, ignoring
  // nulls and clamping future timestamps (clock moved backwards) to now.
  const candidates = [parseIso(state.lastDrinkAt), parseIso(state.lastReminderAt)]
    .filter((v): v is number => v !== null)
    .map((v) => Math.min(v, now));
  candidates.push(start);
  const anchor = Math.max(...candidates);

  const intervalMs = settings.reminderEveryMin * 60_000;
  if (now - anchor >= intervalMs) return { kind: "due" };

  const dueAt = anchor + intervalMs;
  return { kind: "waiting", dueAt: dueAt < end ? dueAt : null };
}
