/**
 * Local-date and time helpers. All "today", weekday and active-hours maths use
 * the system timezone at `now`; log keys are local calendar dates and stored
 * timestamps are UTC ISO strings. Nothing here touches Tauri or the DOM.
 */

/** A local calendar date formatted `YYYY-MM-DD`. */
export type DateKey = string;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local calendar date of an instant, as `YYYY-MM-DD`. */
export function dateKeyOf(ms: number): DateKey {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** True when `s` is a well-formed local date key that round-trips. */
export function isValidDateKey(s: unknown): s is DateKey {
  if (typeof s !== "string" || !DATE_KEY_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

/** ISO weekday of an instant: 1 = Monday .. 7 = Sunday (local). */
export function isoWeekday(ms: number): number {
  return ((new Date(ms).getDay() + 6) % 7) + 1;
}

/** Parse `HH:MM` strictly to minutes-of-day 0..1439, else null. */
export function parseHHMM(s: unknown): number | null {
  if (typeof s !== "string" || !/^\d{2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** Minutes since local midnight for an instant. */
export function minutesOfDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

/** Epoch ms of a local wall-clock time (`minutes` since midnight) on `ms`'s local date. */
export function atLocalMinutes(ms: number, minutes: number): number {
  const d = new Date(ms);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  ).getTime();
}

/** Epoch ms of local midnight that starts `ms`'s day. */
export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Epoch ms of the next local midnight after `ms`. */
export function nextLocalMidnight(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

/** Step a date key by `n` days (local-noon arithmetic is DST-safe). */
export function addDays(key: DateKey, n: number): DateKey {
  const [y, m, d] = key.split("-").map(Number);
  const stepped = new Date(y, m - 1, d + n, 12);
  return dateKeyOf(stepped.getTime());
}

/** The last `n` local date keys ending today, oldest first. */
export function lastNDateKeys(nowMs: number, n: number): DateKey[] {
  const today = dateKeyOf(nowMs);
  const keys: DateKey[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(addDays(today, -i));
  }
  return keys;
}

/** UTC ISO string of an instant. */
export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

/** Parse an ISO timestamp string to epoch ms, else null. */
export function parseIso(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
