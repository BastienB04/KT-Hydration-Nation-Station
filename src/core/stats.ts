/**
 * Timezone-correct statistics over the intake log. Pure; no Tauri, no DOM.
 */
import type { Entry, Log } from "./schema";
import { addDays, dateKeyOf, lastNDateKeys, type DateKey } from "./time";

export function dayTotal(log: Log, key: DateKey): number {
  const entries = log[key];
  if (!entries) return 0;
  return entries.reduce((sum, e) => sum + e.ml, 0);
}

export function todayKey(now: number): DateKey {
  return dateKeyOf(now);
}

export function todayEntries(log: Log, now: number): Entry[] {
  return log[dateKeyOf(now)] ?? [];
}

export function todayTotal(log: Log, now: number): number {
  return dayTotal(log, dateKeyOf(now));
}

/** Fraction of the goal reached, clamped to 0..1. */
export function progress(total: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(1, total / goal));
}

export interface DaySummary {
  key: DateKey;
  total: number;
  met: boolean;
  isToday: boolean;
}

/** The last seven days, oldest first, each compared against the current goal. */
export function lastSevenDays(log: Log, now: number, goal: number): DaySummary[] {
  const today = dateKeyOf(now);
  return lastNDateKeys(now, 7).map((key) => {
    const total = dayTotal(log, key);
    return { key, total, met: total >= goal, isToday: key === today };
  });
}

/**
 * Consecutive days meeting the goal, ending yesterday, plus 1 if today is met.
 * An unmet today does not break the streak until the day ends. v1 compares past
 * days against the current goal.
 */
export function streak(log: Log, now: number, goal: number): number {
  const today = dateKeyOf(now);
  let count = 0;
  if (dayTotal(log, today) >= goal) count += 1;

  const maxDays = Object.keys(log).length + 1;
  let key = addDays(today, -1);
  for (let i = 0; i < maxDays; i += 1) {
    if (dayTotal(log, key) >= goal) {
      count += 1;
      key = addDays(key, -1);
    } else {
      break;
    }
  }
  return count;
}

/** The most recent entry timestamp across all days, or null. */
export function latestEntryAt(log: Log): string | null {
  let latest: string | null = null;
  for (const entries of Object.values(log)) {
    for (const e of entries) {
      if (latest === null || e.t > latest) latest = e.t;
    }
  }
  return latest;
}
