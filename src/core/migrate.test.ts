import { describe, expect, it } from "vitest";
import { migrate } from "./migrate";
import { createDefaultData, DEFAULT_SETTINGS } from "./schema";

describe("migrate", () => {
  it("returns defaults with changed=true for non-objects", () => {
    for (const input of [undefined, null, "oops", 7, [1, 2, 3]]) {
      const { data, changed } = migrate(input);
      expect(changed).toBe(true);
      expect(data).toEqual(createDefaultData());
    }
  });

  it("defaults an empty object", () => {
    const { data, changed } = migrate({});
    expect(changed).toBe(true);
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(data.log).toEqual({});
  });

  it("fills partial settings and replaces wrong types", () => {
    const { data } = migrate({ schemaVersion: 1, settings: { dailyGoalMl: 3000, activeDays: [2, 1, 1] } });
    expect(data.settings.dailyGoalMl).toBe(3000);
    expect(data.settings.activeDays).toEqual([1, 2]);
  });

  it("drops invalid log keys and entries and sorts the rest", () => {
    const { data } = migrate({
      schemaVersion: 1,
      settings: {},
      state: {},
      log: {
        "not-a-date": [{ t: "2026-11-04T08:00:00Z", ml: 250 }],
        "2026-11-04": [
          { t: "2026-11-04T10:00:00Z", ml: 250 },
          { t: "2026-11-04T08:00:00Z", ml: 150 },
          { t: "bad", ml: 100 },
          { t: "2026-11-04T09:00:00Z", ml: 0 },
          { t: "2026-11-04T09:30:00Z", ml: 99999 },
        ],
        "2026-11-05": [{ t: "x", ml: 10 }],
      },
    });
    expect(Object.keys(data.log)).toEqual(["2026-11-04"]);
    expect(data.log["2026-11-04"]).toEqual([
      { t: "2026-11-04T08:00:00Z", ml: 150 },
      { t: "2026-11-04T10:00:00Z", ml: 250 },
    ]);
  });

  it("nulls invalid timestamps and clamps tipIndex and celebration date", () => {
    const { data } = migrate({
      schemaVersion: 1,
      state: {
        lastReminderAt: "bad",
        lastDrinkAt: "2026-11-04T08:00:00Z",
        pausedUntil: 12,
        tipIndex: -3,
        lastCelebratedDate: "nope",
      },
    });
    expect(data.state.lastReminderAt).toBeNull();
    expect(data.state.lastDrinkAt).toBe("2026-11-04T08:00:00Z");
    expect(data.state.pausedUntil).toBeNull();
    expect(data.state.tipIndex).toBe(0);
    expect(data.state.lastCelebratedDate).toBeNull();
  });

  it("reports changed=false for an already-valid document and round-trips JSON", () => {
    const valid = createDefaultData();
    valid.settings.setupDone = true;
    valid.log["2026-11-04"] = [{ t: "2026-11-04T08:00:00Z", ml: 250 }];
    const roundTripped = JSON.parse(JSON.stringify(valid));
    const { data, changed } = migrate(roundTripped);
    expect(changed).toBe(false);
    expect(data).toEqual(valid);
  });

  it("does not mutate the input", () => {
    const input = { schemaVersion: 1, settings: { dailyGoalMl: 2500 }, state: {}, log: {} };
    const snapshot = JSON.parse(JSON.stringify(input));
    migrate(input);
    expect(input).toEqual(snapshot);
  });

  it("accepts a higher schemaVersion as best effort", () => {
    const { data } = migrate({ schemaVersion: 2, settings: { dailyGoalMl: 2200 }, state: {}, log: {} });
    expect(data.schemaVersion).toBe(1);
    expect(data.settings.dailyGoalMl).toBe(2200);
  });
});
