import { describe, expect, it } from "vitest";
import { createDefaultData, type PersistedData } from "../core/schema";
import { reduce, type RootState } from "./reducer";

function root(mutate?: (d: PersistedData) => void): RootState {
  const data = createDefaultData();
  data.settings.setupDone = true;
  mutate?.(data);
  return { data, ui: { saveError: null, notificationsBlocked: false } };
}

// Local wall-clock instant on 2026-11-04 (GMT, so local == UTC).
function at(h: number, m = 0): number {
  return new Date(2026, 10, 4, h, m).getTime();
}
function iso(h: number, m = 0): string {
  return new Date(2026, 10, 4, h, m).toISOString();
}

describe("logDrink", () => {
  it("buckets by local day, sorts and sets lastDrinkAt", () => {
    const start = root();
    const a = reduce(start, { type: "logDrink", ml: 250, now: at(10) });
    const b = reduce(a, { type: "logDrink", ml: 150, now: at(8) });
    const entries = b.data.log["2026-11-04"];
    expect(entries.map((e) => e.ml)).toEqual([150, 250]);
    expect(b.data.state.lastDrinkAt).toBe(iso(8));
  });

  it("rejects an invalid amount with the same reference", () => {
    const start = root();
    expect(reduce(start, { type: "logDrink", ml: 0, now: at(10) })).toBe(start);
    expect(reduce(start, { type: "logDrink", ml: 2.5, now: at(10) })).toBe(start);
    expect(reduce(start, { type: "logDrink", ml: 99999, now: at(10) })).toBe(start);
  });
});

describe("undoLast", () => {
  it("is a no-op with no entries today", () => {
    const start = root();
    expect(reduce(start, { type: "undoLast", now: at(10) })).toBe(start);
  });

  it("removes the single entry and clears the day", () => {
    const one = reduce(root(), { type: "logDrink", ml: 250, now: at(10) });
    const undone = reduce(one, { type: "undoLast", now: at(10) });
    expect(undone.data.log["2026-11-04"]).toBeUndefined();
    expect(undone.data.state.lastDrinkAt).toBeNull();
  });

  it("resets lastDrinkAt to the previous day's latest entry", () => {
    const start = root((d) => {
      d.log["2026-11-03"] = [{ t: new Date(2026, 10, 3, 20).toISOString(), ml: 500 }];
    });
    const logged = reduce(start, { type: "logDrink", ml: 250, now: at(10) });
    const undone = reduce(logged, { type: "undoLast", now: at(10) });
    expect(undone.data.state.lastDrinkAt).toBe(new Date(2026, 10, 3, 20).toISOString());
  });
});

describe("editEntry and deleteEntry", () => {
  const base = root((d) => {
    d.log["2026-11-04"] = [
      { t: iso(8), ml: 150 },
      { t: iso(10), ml: 250 },
    ];
  });

  it("edits only on a matching timestamp", () => {
    expect(reduce(base, { type: "editEntry", key: "2026-11-04", index: 0, t: iso(9), ml: 300 })).toBe(base);
    const edited = reduce(base, { type: "editEntry", key: "2026-11-04", index: 0, t: iso(8), ml: 300 });
    expect(edited.data.log["2026-11-04"][0].ml).toBe(300);
  });

  it("rejects an invalid edit amount", () => {
    expect(reduce(base, { type: "editEntry", key: "2026-11-04", index: 0, t: iso(8), ml: 0 })).toBe(base);
  });

  it("deletes only on a matching timestamp and recomputes lastDrinkAt", () => {
    expect(reduce(base, { type: "deleteEntry", key: "2026-11-04", index: 1, t: iso(9) })).toBe(base);
    const deleted = reduce(base, { type: "deleteEntry", key: "2026-11-04", index: 1, t: iso(10) });
    expect(deleted.data.log["2026-11-04"].map((e) => e.ml)).toEqual([150]);
    expect(deleted.data.state.lastDrinkAt).toBe(iso(8));
  });
});

describe("settings and setup", () => {
  it("completeSetup merges, normalizes and marks done", () => {
    const start = root((d) => {
      d.settings.setupDone = false;
    });
    const done = reduce(start, {
      type: "completeSetup",
      dailyGoalMl: 2500,
      activeHours: { start: "07:00", end: "21:00" },
      frogName: "  Hopkins  ",
    });
    expect(done.data.settings.setupDone).toBe(true);
    expect(done.data.settings.dailyGoalMl).toBe(2500);
    expect(done.data.settings.frogName).toBe("Hopkins");
  });
});

describe("pause, snooze, resume", () => {
  it("snooze pauses by the snooze length", () => {
    const start = root((d) => {
      d.settings.snoozeMin = 10;
    });
    const snoozed = reduce(start, { type: "snooze", now: at(10) });
    expect(snoozed.data.state.pausedUntil).toBe(iso(10, 10));
  });

  it("pauseUntil and resume", () => {
    const paused = reduce(root(), { type: "pauseUntil", until: at(11) });
    expect(paused.data.state.pausedUntil).toBe(iso(11));
    const resumed = reduce(paused, { type: "resume" });
    expect(resumed.data.state.pausedUntil).toBeNull();
  });

  it("resume is a no-op when not paused", () => {
    const start = root();
    expect(reduce(start, { type: "resume" })).toBe(start);
  });
});

describe("reminderFired and tips", () => {
  it("advances the tip and sets lastReminderAt", () => {
    const start = root((d) => {
      d.state.tipIndex = 0;
    });
    const fired = reduce(start, { type: "reminderFired", now: at(10) });
    expect(fired.data.state.lastReminderAt).toBe(iso(10));
    expect(fired.data.state.tipIndex).toBe(1);
  });
});

describe("reset", () => {
  it("returns fresh defaults", () => {
    const start = root((d) => {
      d.log["2026-11-04"] = [{ t: iso(8), ml: 250 }];
    });
    const reset = reduce(start, { type: "reset" });
    expect(reset.data).toEqual(createDefaultData());
    expect(reset.ui).toEqual({ saveError: null, notificationsBlocked: false });
  });
});

describe("immutability", () => {
  it("never mutates a frozen input", () => {
    const start = root((d) => {
      d.log["2026-11-04"] = [{ t: iso(8), ml: 250 }];
    });
    deepFreeze(start);
    expect(() => reduce(start, { type: "logDrink", ml: 150, now: at(9) })).not.toThrow();
    expect(() => reduce(start, { type: "undoLast", now: at(9) })).not.toThrow();
    expect(() => reduce(start, { type: "reset" })).not.toThrow();
  });
});

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.values(obj).forEach(deepFreeze);
    Object.freeze(obj);
  }
  return obj;
}
