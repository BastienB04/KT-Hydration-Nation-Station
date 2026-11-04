/**
 * Pure reducer over the persisted data plus transient UI flags. An invalid or
 * no-op action returns the same root reference, so the store can skip work and
 * subscribers are not woken needlessly.
 */
import {
  createDefaultData,
  LIMITS,
  type ActiveHours,
  type Entry,
  type PersistedData,
  type Settings,
} from "../core/schema";
import { normalizeSettings } from "../core/settings";
import { latestEntryAt } from "../core/stats";
import { nextTipIndex } from "../core/tips";
import { dateKeyOf, toIso, type DateKey } from "../core/time";

export interface RootState {
  data: PersistedData;
  ui: { saveError: string | null; notificationsBlocked: boolean };
}

export type Action =
  | { type: "hydrate"; data: PersistedData }
  | { type: "logDrink"; ml: number; now: number }
  | { type: "undoLast"; now: number }
  | { type: "editEntry"; key: DateKey; index: number; t: string; ml: number }
  | { type: "deleteEntry"; key: DateKey; index: number; t: string }
  | { type: "updateSettings"; settings: Settings }
  | { type: "completeSetup"; dailyGoalMl: number; activeHours: ActiveHours; frogName: string }
  | { type: "pauseUntil"; until: number }
  | { type: "snooze"; now: number }
  | { type: "resume" }
  | { type: "reminderFired"; now: number }
  | { type: "nextTip" }
  | { type: "celebrated"; key: DateKey }
  | { type: "reset" }
  | { type: "setSaveError"; message: string | null }
  | { type: "setNotificationsBlocked"; blocked: boolean };

function isValidMl(ml: number): boolean {
  return Number.isInteger(ml) && ml >= LIMITS.entryMinMl && ml <= LIMITS.entryMaxMl;
}

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
}

function withData(root: RootState, data: PersistedData): RootState {
  return { ...root, data };
}

function withState(root: RootState, state: Partial<PersistedData["state"]>): RootState {
  return withData(root, { ...root.data, state: { ...root.data.state, ...state } });
}

export function reduce(root: RootState, action: Action): RootState {
  const { data } = root;

  switch (action.type) {
    case "hydrate":
      return { ...root, data: action.data };

    case "logDrink": {
      if (!isValidMl(action.ml)) return root;
      const key = dateKeyOf(action.now);
      const t = toIso(action.now);
      const entries = sortEntries([...(data.log[key] ?? []), { t, ml: action.ml }]);
      return withData(root, {
        ...data,
        log: { ...data.log, [key]: entries },
        state: { ...data.state, lastDrinkAt: t },
      });
    }

    case "undoLast": {
      const key = dateKeyOf(action.now);
      const entries = data.log[key];
      if (!entries || entries.length === 0) return root;
      const log = { ...data.log };
      const remaining = entries.slice(0, -1);
      if (remaining.length === 0) delete log[key];
      else log[key] = remaining;
      return withData(root, { ...data, log, state: { ...data.state, lastDrinkAt: latestEntryAt(log) } });
    }

    case "editEntry": {
      const entries = data.log[action.key];
      const current = entries?.[action.index];
      if (!current || current.t !== action.t || !isValidMl(action.ml)) return root;
      if (current.ml === action.ml) return root;
      const updated = entries.map((e, i) => (i === action.index ? { ...e, ml: action.ml } : e));
      return withData(root, { ...data, log: { ...data.log, [action.key]: updated } });
    }

    case "deleteEntry": {
      const entries = data.log[action.key];
      const current = entries?.[action.index];
      if (!current || current.t !== action.t) return root;
      const log = { ...data.log };
      const remaining = entries.filter((_, i) => i !== action.index);
      if (remaining.length === 0) delete log[action.key];
      else log[action.key] = remaining;
      return withData(root, { ...data, log, state: { ...data.state, lastDrinkAt: latestEntryAt(log) } });
    }

    case "updateSettings":
      return withData(root, { ...data, settings: normalizeSettings(action.settings) });

    case "completeSetup": {
      const settings = normalizeSettings({
        ...data.settings,
        dailyGoalMl: action.dailyGoalMl,
        activeHours: action.activeHours,
        frogName: action.frogName,
        setupDone: true,
      });
      return withData(root, { ...data, settings });
    }

    case "pauseUntil":
      return withState(root, { pausedUntil: toIso(action.until) });

    case "snooze":
      return withState(root, { pausedUntil: toIso(action.now + data.settings.snoozeMin * 60_000) });

    case "resume":
      if (data.state.pausedUntil === null) return root;
      return withState(root, { pausedUntil: null });

    case "reminderFired":
      return withState(root, {
        lastReminderAt: toIso(action.now),
        tipIndex: nextTipIndex(data.state.tipIndex),
      });

    case "nextTip":
      return withState(root, { tipIndex: nextTipIndex(data.state.tipIndex) });

    case "celebrated":
      if (data.state.lastCelebratedDate === action.key) return root;
      return withState(root, { lastCelebratedDate: action.key });

    case "reset":
      return { data: createDefaultData(), ui: { saveError: null, notificationsBlocked: false } };

    case "setSaveError":
      if (root.ui.saveError === action.message) return root;
      return { ...root, ui: { ...root.ui, saveError: action.message } };

    case "setNotificationsBlocked":
      if (root.ui.notificationsBlocked === action.blocked) return root;
      return { ...root, ui: { ...root.ui, notificationsBlocked: action.blocked } };
  }
}
