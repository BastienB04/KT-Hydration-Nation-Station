/**
 * Persisted data shape (Requirements 4.4) plus defaults and validation limits.
 * The store on disk is `{ schemaVersion, settings, state, log }`.
 */
import type { DateKey } from "./time";

export const SCHEMA_VERSION = 1;

export interface ActiveHours {
  /** Local `HH:MM`, inclusive start of the reminder window. */
  start: string;
  /** Local `HH:MM`, exclusive end of the reminder window. */
  end: string;
}

export interface Settings {
  dailyGoalMl: number;
  quickAddMl: [number, number, number];
  reminderEveryMin: number;
  activeHours: ActiveHours;
  /** ISO weekdays, 1 = Monday .. 7 = Sunday, sorted and unique. */
  activeDays: number[];
  snoozeMin: number;
  soundEnabled: boolean;
  launchAtLogin: boolean;
  checkUpdates: boolean;
  frogName: string;
  setupDone: boolean;
}

export interface Entry {
  /** UTC ISO timestamp of the drink. */
  t: string;
  /** Millilitres, a positive integer. */
  ml: number;
}

export type Log = Record<DateKey, Entry[]>;

export interface PersistedState {
  lastReminderAt: string | null;
  lastDrinkAt: string | null;
  pausedUntil: string | null;
  tipIndex: number;
  lastCelebratedDate: DateKey | null;
}

export interface PersistedData {
  schemaVersion: typeof SCHEMA_VERSION;
  settings: Settings;
  state: PersistedState;
  log: Log;
}

/** Validation ranges, shared by settings validation and migration defaulting. */
export const LIMITS = {
  goalMinMl: 100,
  goalMaxMl: 10_000,
  entryMinMl: 1,
  entryMaxMl: 5_000,
  intervalMinMin: 1,
  intervalMaxMin: 480,
  snoozeMinMin: 1,
  snoozeMaxMin: 120,
  frogNameMaxLen: 24,
} as const;

export const DEFAULT_SETTINGS: Settings = {
  dailyGoalMl: 2000,
  quickAddMl: [150, 250, 500],
  reminderEveryMin: 60,
  activeHours: { start: "08:00", end: "22:00" },
  activeDays: [1, 2, 3, 4, 5, 6, 7],
  snoozeMin: 10,
  soundEnabled: true,
  launchAtLogin: true,
  checkUpdates: true,
  frogName: "Ribbit",
  setupDone: false,
};

export const DEFAULT_STATE: PersistedState = {
  lastReminderAt: null,
  lastDrinkAt: null,
  pausedUntil: null,
  tipIndex: 0,
  lastCelebratedDate: null,
};

/** Fresh install data; returns new objects every call. */
export function createDefaultData(): PersistedData {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS, quickAddMl: [...DEFAULT_SETTINGS.quickAddMl], activeDays: [...DEFAULT_SETTINGS.activeDays], activeHours: { ...DEFAULT_SETTINGS.activeHours } },
    state: { ...DEFAULT_STATE },
    log: {},
  };
}
