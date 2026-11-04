/**
 * Defensive migration of whatever is on disk into a valid PersistedData.
 * The plugin-store swallows load errors and returns an empty object for a
 * corrupt file, so migration must also tolerate missing or junk values. The
 * input is never mutated.
 */
import {
  SCHEMA_VERSION,
  createDefaultData,
  DEFAULT_STATE,
  LIMITS,
  type Entry,
  type Log,
  type PersistedData,
  type PersistedState,
} from "./schema";
import { normalizeSettings } from "./settings";
import { isValidDateKey, parseIso } from "./time";

export interface MigrationResult {
  data: PersistedData;
  changed: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateLog(raw: unknown): Log {
  const log: Log = {};
  if (!isPlainObject(raw)) return log;
  for (const [key, value] of Object.entries(raw)) {
    if (!isValidDateKey(key) || !Array.isArray(value)) continue;
    const entries: Entry[] = [];
    for (const item of value) {
      if (!isPlainObject(item)) continue;
      const t = item.t;
      const ml = item.ml;
      if (
        typeof t === "string" &&
        parseIso(t) !== null &&
        typeof ml === "number" &&
        Number.isInteger(ml) &&
        ml >= LIMITS.entryMinMl &&
        ml <= LIMITS.entryMaxMl
      ) {
        entries.push({ t, ml });
      }
    }
    if (entries.length > 0) {
      entries.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
      log[key] = entries;
    }
  }
  return log;
}

function migrateState(raw: unknown): PersistedState {
  if (!isPlainObject(raw)) return { ...DEFAULT_STATE };
  const isoOrNull = (v: unknown): string | null =>
    typeof v === "string" && parseIso(v) !== null ? v : null;
  const tipIndex =
    typeof raw.tipIndex === "number" && Number.isInteger(raw.tipIndex) && raw.tipIndex >= 0
      ? raw.tipIndex
      : 0;
  const lastCelebratedDate = isValidDateKey(raw.lastCelebratedDate)
    ? raw.lastCelebratedDate
    : null;
  return {
    lastReminderAt: isoOrNull(raw.lastReminderAt),
    lastDrinkAt: isoOrNull(raw.lastDrinkAt),
    pausedUntil: isoOrNull(raw.pausedUntil),
    tipIndex,
    lastCelebratedDate,
  };
}

/** Structural deep-equality used only to decide whether anything changed. */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => isDeepEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && isDeepEqual(a[k], b[k]));
  }
  return false;
}

export function migrate(raw: unknown): MigrationResult {
  if (!isPlainObject(raw)) {
    return { data: createDefaultData(), changed: true };
  }

  const version = raw.schemaVersion;
  if (typeof version === "number" && version > SCHEMA_VERSION) {
    console.warn(
      `store schemaVersion ${version} is newer than supported ${SCHEMA_VERSION}; normalizing as best effort`,
    );
  }

  const data: PersistedData = {
    schemaVersion: SCHEMA_VERSION,
    settings: normalizeSettings(raw.settings),
    state: migrateState(raw.state),
    log: migrateLog(raw.log),
  };

  return { data, changed: !isDeepEqual(raw, data) };
}
