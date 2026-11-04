/**
 * Settings parsing, draft validation and defensive normalization.
 * Pure: no Tauri, no DOM.
 */
import {
  DEFAULT_SETTINGS,
  LIMITS,
  type ActiveHours,
  type Settings,
} from "./schema";
import { parseHHMM } from "./time";

export type AmountResult =
  | { ok: true; ml: number }
  | { ok: false; error: string };

/** Parse a user-entered amount: a positive integer within the entry limits. */
export function parseAmount(text: string): AmountResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: "Enter an amount in ml." };
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "Use whole millilitres, digits only." };
  }
  const ml = Number(trimmed);
  if (ml < LIMITS.entryMinMl) return { ok: false, error: "That's a bit small." };
  if (ml > LIMITS.entryMaxMl) {
    return { ok: false, error: `Keep it under ${LIMITS.entryMaxMl} ml per sip.` };
  }
  return { ok: true, ml };
}

/** String-backed form of the numeric settings fields for text inputs. */
export interface SettingsDraft {
  dailyGoalMl: string;
  quickAddMl: [string, string, string];
  reminderEveryMin: string;
  activeHours: ActiveHours;
  activeDays: number[];
  snoozeMin: string;
  soundEnabled: boolean;
  launchAtLogin: boolean;
  checkUpdates: boolean;
  frogName: string;
}

export function draftFromSettings(s: Settings): SettingsDraft {
  return {
    dailyGoalMl: String(s.dailyGoalMl),
    quickAddMl: [String(s.quickAddMl[0]), String(s.quickAddMl[1]), String(s.quickAddMl[2])],
    reminderEveryMin: String(s.reminderEveryMin),
    activeHours: { ...s.activeHours },
    activeDays: [...s.activeDays],
    snoozeMin: String(s.snoozeMin),
    soundEnabled: s.soundEnabled,
    launchAtLogin: s.launchAtLogin,
    checkUpdates: s.checkUpdates,
    frogName: s.frogName,
  };
}

export type SettingsErrorKey =
  | keyof Settings
  | "quickAddMl.0"
  | "quickAddMl.1"
  | "quickAddMl.2";

export type SettingsDraftResult =
  | { ok: true; settings: Settings }
  | { ok: false; errors: Partial<Record<SettingsErrorKey, string>> };

function parseIntField(text: string, min: number, max: number): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= min && n <= max ? n : null;
}

/** Parse a daily goal: a whole number within the goal limits, else null. */
export function parseGoal(text: string): number | null {
  return parseIntField(text, LIMITS.goalMinMl, LIMITS.goalMaxMl);
}

/** Validate a draft into Settings, collecting per-field errors. */
export function validateSettingsDraft(draft: SettingsDraft): SettingsDraftResult {
  const errors: Partial<Record<SettingsErrorKey, string>> = {};

  const goal = parseIntField(draft.dailyGoalMl, LIMITS.goalMinMl, LIMITS.goalMaxMl);
  if (goal === null) {
    errors.dailyGoalMl = `Goal must be ${LIMITS.goalMinMl}–${LIMITS.goalMaxMl} ml.`;
  }

  const quick: number[] = [];
  draft.quickAddMl.forEach((value, i) => {
    const parsed = parseIntField(value, LIMITS.entryMinMl, LIMITS.entryMaxMl);
    if (parsed === null) {
      errors[`quickAddMl.${i}` as SettingsErrorKey] = `1–${LIMITS.entryMaxMl} ml.`;
    } else {
      quick[i] = parsed;
    }
  });

  const interval = parseIntField(draft.reminderEveryMin, LIMITS.intervalMinMin, LIMITS.intervalMaxMin);
  if (interval === null) {
    errors.reminderEveryMin = `Interval must be ${LIMITS.intervalMinMin}–${LIMITS.intervalMaxMin} min.`;
  }

  const start = parseHHMM(draft.activeHours.start);
  const end = parseHHMM(draft.activeHours.end);
  if (start === null || end === null || start >= end) {
    errors.activeHours = "End time must be after the start time.";
  }

  const days = [...new Set(draft.activeDays)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (days.length === 0) {
    errors.activeDays = "Pick at least one day.";
  }

  const snooze = parseIntField(draft.snoozeMin, LIMITS.snoozeMinMin, LIMITS.snoozeMaxMin);
  if (snooze === null) {
    errors.snoozeMin = `Snooze must be ${LIMITS.snoozeMinMin}–${LIMITS.snoozeMaxMin} min.`;
  }

  const frogName = draft.frogName.trim();
  if (frogName === "") {
    errors.frogName = "Give your frog a name.";
  } else if (frogName.length > LIMITS.frogNameMaxLen) {
    errors.frogName = `Keep it to ${LIMITS.frogNameMaxLen} characters.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    settings: {
      dailyGoalMl: goal as number,
      quickAddMl: [quick[0], quick[1], quick[2]],
      reminderEveryMin: interval as number,
      activeHours: { start: draft.activeHours.start, end: draft.activeHours.end },
      activeDays: days,
      snoozeMin: snooze as number,
      soundEnabled: draft.soundEnabled,
      launchAtLogin: draft.launchAtLogin,
      checkUpdates: draft.checkUpdates,
      frogName,
      setupDone: true,
    },
  };
}

function numberOr(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Coerce arbitrary input into valid Settings, field by field, using defaults. */
export function normalizeSettings(raw: unknown): Settings {
  const src = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const quickRaw = Array.isArray(src.quickAddMl) ? src.quickAddMl : [];
  const quickAddMl: [number, number, number] = [
    numberOr(quickRaw[0], DEFAULT_SETTINGS.quickAddMl[0], LIMITS.entryMinMl, LIMITS.entryMaxMl),
    numberOr(quickRaw[1], DEFAULT_SETTINGS.quickAddMl[1], LIMITS.entryMinMl, LIMITS.entryMaxMl),
    numberOr(quickRaw[2], DEFAULT_SETTINGS.quickAddMl[2], LIMITS.entryMinMl, LIMITS.entryMaxMl),
  ];

  const hoursRaw = (typeof src.activeHours === "object" && src.activeHours !== null
    ? src.activeHours
    : {}) as Record<string, unknown>;
  const start = parseHHMM(hoursRaw.start);
  const end = parseHHMM(hoursRaw.end);
  const activeHours: ActiveHours =
    start !== null && end !== null && start < end
      ? { start: hoursRaw.start as string, end: hoursRaw.end as string }
      : { ...DEFAULT_SETTINGS.activeHours };

  const daysRaw = Array.isArray(src.activeDays) ? src.activeDays : [];
  const days = [...new Set(daysRaw)]
    .filter((d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 1 && d <= 7)
    .sort((a, b) => a - b);
  const activeDays = days.length > 0 ? days : [...DEFAULT_SETTINGS.activeDays];

  let frogName = typeof src.frogName === "string" ? src.frogName.trim() : "";
  if (frogName === "") frogName = DEFAULT_SETTINGS.frogName;
  else if (frogName.length > LIMITS.frogNameMaxLen) frogName = frogName.slice(0, LIMITS.frogNameMaxLen);

  return {
    dailyGoalMl: numberOr(src.dailyGoalMl, DEFAULT_SETTINGS.dailyGoalMl, LIMITS.goalMinMl, LIMITS.goalMaxMl),
    quickAddMl,
    reminderEveryMin: numberOr(src.reminderEveryMin, DEFAULT_SETTINGS.reminderEveryMin, LIMITS.intervalMinMin, LIMITS.intervalMaxMin),
    activeHours,
    activeDays,
    snoozeMin: numberOr(src.snoozeMin, DEFAULT_SETTINGS.snoozeMin, LIMITS.snoozeMinMin, LIMITS.snoozeMaxMin),
    soundEnabled: boolOr(src.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    launchAtLogin: boolOr(src.launchAtLogin, DEFAULT_SETTINGS.launchAtLogin),
    checkUpdates: boolOr(src.checkUpdates, DEFAULT_SETTINGS.checkUpdates),
    frogName,
    setupDone: boolOr(src.setupDone, DEFAULT_SETTINGS.setupDone),
  };
}
