/**
 * Week screen summary and streak caption. Pure; works on `lastSevenDays`
 * output (oldest first, today last) and the `streak` run length.
 */
import { formatWeekdayShort } from "./format";
import type { DaySummary } from "./stats";
import { addDays } from "./time";

export interface WeekSummary {
  /** Days in the window (including today) that met the goal. */
  metCount: number;
  /** Mean intake over all seven days including today, rounded to whole ml. */
  averageMl: number;
}

export function weekSummary(days: DaySummary[]): WeekSummary {
  const metCount = days.filter((d) => d.met).length;
  const total = days.reduce((sum, d) => sum + d.total, 0);
  return { metCount, averageMl: days.length === 0 ? 0 : Math.round(total / days.length) };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Caption describing the current streak: the run ends today when today is
 * met, otherwise yesterday (an unmet today does not break it yet).
 */
export function streakCaption(days: DaySummary[], run: number): string {
  if (run <= 0 || days.length === 0) return "No streak yet: today's a good day to start.";
  if (run > 7) return `${run} days in a row.`;
  const today = days[days.length - 1];
  const endKey = today.met ? today.key : addDays(today.key, -1);
  const names: string[] = [];
  for (let i = run - 1; i >= 0; i -= 1) {
    const key = addDays(endKey, -i);
    names.push(key === today.key ? "today" : formatWeekdayShort(key));
  }
  if (names[0] === "today") names[0] = "Today";
  if (run === 1) return `${names[0]} met the goal.`;
  if (run <= 4) return `${joinNames(names)} in a row.`;
  return `${names[0]} to ${names[names.length - 1]} in a row.`;
}
