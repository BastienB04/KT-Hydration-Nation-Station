/**
 * Display formatting and status copy. Pure; uses Intl only.
 */
import type { Decision } from "./scheduler";
import type { DateKey } from "./time";

const ML_FORMAT = new Intl.NumberFormat("en-US");
const DAY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const WEEKDAY_LONG_FORMAT = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const MONTH_SHORT_FORMAT = new Intl.DateTimeFormat("en-GB", { month: "short" });
/** 1250 -> "1,250". */
export function formatMl(n: number): string {
  return ML_FORMAT.format(n);
}

/** Local "HH:MM" for an instant. */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}`;
}

/** "Mon, 4 Nov" for a local date key (built at local noon). */
export function formatDayLabel(key: DateKey): string {
  const [y, m, d] = key.split("-").map(Number);
  return DAY_FORMAT.format(new Date(y, m - 1, d, 12));
}

/** "Tue" for a local date key (built at local noon). */
export function formatWeekdayShort(key: DateKey): string {
  const [y, m, d] = key.split("-").map(Number);
  return WEEKDAY_FORMAT.format(new Date(y, m - 1, d, 12));
}

/** "Tuesday 3 Nov" for a local date key (built at local noon; no ICU comma). */
export function formatDayLong(key: DateKey): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return `${WEEKDAY_LONG_FORMAT.format(date)} ${d} ${MONTH_SHORT_FORMAT.format(date)}`;
}
/** Home status line describing the current reminder decision. */
export function describeDecision(decision: Decision): string {
  switch (decision.kind) {
    case "setup-incomplete":
      return "Finish setup to start reminders.";
    case "paused":
      return `Paused until ${formatClock(decision.until)}.`;
    case "inactive-day":
      return "Resting today. No reminders on this day.";
    case "outside-hours":
      return "Outside your active hours.";
    case "goal-met":
      return "Goal met. Nice hopping!";
    case "due":
      return "Time for a sip.";
    case "waiting":
      return decision.dueAt === null
        ? "That's your last sip reminder for today."
        : `Next sip around ${formatClock(decision.dueAt)}.`;
  }
}

/** Short status token used inside the tray tooltip. */
function tooltipStatus(decision: Decision): string {
  switch (decision.kind) {
    case "setup-incomplete":
      return "setup pending";
    case "paused":
      return `paused until ${formatClock(decision.until)}`;
    case "inactive-day":
    case "outside-hours":
      return "resting";
    case "goal-met":
      return "goal met";
    case "due":
      return "sip due";
    case "waiting":
      return decision.dueAt === null ? "resting" : `next ${formatClock(decision.dueAt)}`;
  }
}

/** Tray tooltip: "<frog> · 1,250 / 2,000 ml · <status>". */
export function buildTooltip(
  frogName: string,
  total: number,
  goal: number,
  decision: Decision,
): string {
  return `${frogName} · ${formatMl(total)} / ${formatMl(goal)} ml · ${tooltipStatus(decision)}`;
}
