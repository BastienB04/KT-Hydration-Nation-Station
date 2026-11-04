import { describe, expect, it } from "vitest";
import { withTimeZone } from "../test/tz";
import { createDefaultData, type PersistedData } from "./schema";
import { activeWindow, evaluate, restOfDayUntil } from "./scheduler";

// Tests run under Europe/London. November dates are GMT, so local == UTC and a
// local Date's toISOString() is a clean UTC anchor for the state fields.
function makeData(overrides?: {
  settings?: Partial<PersistedData["settings"]>;
  state?: Partial<PersistedData["state"]>;
  log?: PersistedData["log"];
}): PersistedData {
  const data = createDefaultData();
  data.settings.setupDone = true;
  Object.assign(data.settings, overrides?.settings);
  Object.assign(data.state, overrides?.state);
  if (overrides?.log) data.log = overrides.log;
  return data;
}

// Local wall-clock instant on 2026-11-04 (a Wednesday, ISO weekday 3).
function at(h: number, m = 0): number {
  return new Date(2026, 10, 4, h, m).getTime();
}
function iso(h: number, m = 0): string {
  return new Date(2026, 10, 4, h, m).toISOString();
}

describe("evaluate: named states", () => {
  it("setup incomplete", () => {
    const data = makeData();
    data.settings.setupDone = false;
    expect(evaluate(data, at(9)).kind).toBe("setup-incomplete");
  });

  it("paused, and an expired pause falls through", () => {
    const paused = makeData({ state: { pausedUntil: iso(10) } });
    expect(evaluate(paused, at(9)).kind).toBe("paused");
    const expired = makeData({ state: { pausedUntil: iso(8, 30) } });
    expect(evaluate(expired, at(9)).kind).not.toBe("paused");
  });

  it("snooze represented as a pause", () => {
    const snoozed = makeData({ state: { pausedUntil: iso(9, 10) } });
    const d = evaluate(snoozed, at(9));
    expect(d.kind).toBe("paused");
    if (d.kind === "paused") expect(d.until).toBe(at(9, 10));
  });

  it("inactive weekday", () => {
    // Wednesday is ISO 3; allow only Mon/Tue.
    const data = makeData({ settings: { activeDays: [1, 2] } });
    expect(evaluate(data, at(9)).kind).toBe("inactive-day");
  });

  it("before start, at start, and at end", () => {
    const data = makeData();
    expect(evaluate(data, at(7)).kind).toBe("outside-hours");
    expect(evaluate(data, at(8)).kind).toBe("waiting"); // at start, anchor == now
    expect(evaluate(data, at(22)).kind).toBe("outside-hours"); // end is exclusive
  });

  it("goal met", () => {
    const data = makeData({ log: { "2026-11-04": [{ t: iso(8), ml: 2000 }] } });
    expect(evaluate(data, at(9)).kind).toBe("goal-met");
  });

  it("waiting with a dueAt", () => {
    const d = evaluate(makeData(), at(8, 30));
    expect(d).toEqual({ kind: "waiting", dueAt: at(9) });
  });

  it("due exactly at the interval", () => {
    expect(evaluate(makeData(), at(9)).kind).toBe("due");
  });
});

describe("evaluate: anchors", () => {
  it("uses the drink anchor", () => {
    const data = makeData({ state: { lastDrinkAt: iso(8, 45) } });
    expect(evaluate(data, at(9)).kind).toBe("waiting");
    expect(evaluate(data, at(9, 45)).kind).toBe("due");
  });

  it("uses the reminder anchor", () => {
    const data = makeData({ state: { lastReminderAt: iso(8, 50) } });
    expect(evaluate(data, at(9, 30)).kind).toBe("waiting");
  });

  it("ignores a reminder from yesterday (active-start anchor wins)", () => {
    const data = makeData({ state: { lastReminderAt: new Date(2026, 10, 3, 21).toISOString() } });
    expect(evaluate(data, at(9)).kind).toBe("due");
  });

  it("clamps a future timestamp to now", () => {
    const data = makeData({ state: { lastDrinkAt: iso(10) } });
    const d = evaluate(data, at(9));
    expect(d).toEqual({ kind: "waiting", dueAt: at(10) });
  });

  it("gives dueAt null when the next due reaches past end", () => {
    const data = makeData({ state: { lastReminderAt: iso(21) } });
    const d = evaluate(data, at(21, 30));
    expect(d).toEqual({ kind: "waiting", dueAt: null });
  });
});

describe("evaluate: cross-midnight", () => {
  it("rolls to the next active day", () => {
    const data = makeData({ state: { lastReminderAt: new Date(2026, 10, 4, 21, 30).toISOString() } });
    expect(evaluate(data, new Date(2026, 10, 4, 23, 59).getTime()).kind).toBe("outside-hours");
    const next8 = new Date(2026, 10, 5, 8).getTime();
    expect(evaluate(data, next8)).toEqual({ kind: "waiting", dueAt: new Date(2026, 10, 5, 9).getTime() });
    expect(evaluate(data, new Date(2026, 10, 5, 9).getTime()).kind).toBe("due");
  });
});

describe("evaluate: sleep catch-up fires exactly once", () => {
  it("is due once after a long gap, then waits", () => {
    const slept = makeData({ state: { lastReminderAt: iso(10) } });
    expect(evaluate(slept, at(13, 10)).kind).toBe("due");
    // After the fire, lastReminderAt advances to the fire time.
    const fired = makeData({ state: { lastReminderAt: iso(13, 10) } });
    expect(evaluate(fired, new Date(2026, 10, 4, 13, 10, 30).getTime()).kind).toBe("waiting");
    expect(evaluate(fired, at(13, 40)).kind).toBe("waiting");
  });
});

describe("evaluate: DST and timezone", () => {
  it("first due at 09:00 local on the London DST start day", () => {
    // 2026-03-29, clocks go forward at 01:00.
    const start = new Date(2026, 2, 29, 8).getTime();
    const data = makeData();
    // 2026-03-29 is a Sunday (ISO 7), which is active by default.
    expect(evaluate(data, start).kind).toBe("waiting");
    expect(evaluate(data, new Date(2026, 2, 29, 9).getTime()).kind).toBe("due");
  });

  it("the same instant is inside hours in London and outside in Auckland", () => {
    const instant = Date.UTC(2026, 10, 4, 12); // London 12:00, Auckland 01:00 next day
    const data = makeData();
    expect(withTimeZone("Europe/London", () => evaluate(data, instant).kind)).toBe("due");
    expect(withTimeZone("Pacific/Auckland", () => evaluate(data, instant).kind)).toBe("outside-hours");
  });
});

describe("activeWindow and restOfDayUntil", () => {
  it("builds the window for the day", () => {
    const { start, end } = activeWindow(makeData().settings, at(12));
    expect(start).toBe(at(8));
    expect(end).toBe(at(22));
  });

  it("rest of day is the active end before it, next midnight after", () => {
    const settings = makeData().settings;
    expect(restOfDayUntil(settings, at(12))).toBe(at(22));
    expect(restOfDayUntil(settings, at(23))).toBe(new Date(2026, 10, 5).getTime());
  });
});
