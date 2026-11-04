import { describe, expect, it } from "vitest";
import { withTimeZone } from "../test/tz";
import type { Log } from "./schema";
import { dayTotal, lastSevenDays, latestEntryAt, progress, streak, todayTotal } from "./stats";

function entry(t: string, ml: number) {
  return { t, ml };
}

describe("totals", () => {
  const log: Log = {
    "2026-11-04": [entry("2026-11-04T08:00:00Z", 250), entry("2026-11-04T10:00:00Z", 500)],
  };

  it("sums a day", () => {
    expect(dayTotal(log, "2026-11-04")).toBe(750);
    expect(dayTotal(log, "2026-11-03")).toBe(0);
  });

  it("sums today", () => {
    const now = new Date(2026, 10, 4, 12).getTime();
    expect(todayTotal(log, now)).toBe(750);
  });
});

describe("progress", () => {
  it("clamps over the goal and handles a zero goal", () => {
    expect(progress(500, 2000)).toBeCloseTo(0.25);
    expect(progress(3000, 2000)).toBe(1);
    expect(progress(100, 0)).toBe(0);
  });
});

describe("lastSevenDays", () => {
  it("returns seven oldest-first entries with gaps as zero", () => {
    const now = new Date(2026, 10, 4, 12).getTime();
    const log: Log = {
      "2026-11-04": [entry("2026-11-04T08:00:00Z", 2000)],
      "2026-11-01": [entry("2026-11-01T08:00:00Z", 500)],
    };
    const days = lastSevenDays(log, now, 2000);
    expect(days).toHaveLength(7);
    expect(days[6]).toMatchObject({ key: "2026-11-04", total: 2000, met: true, isToday: true });
    expect(days[3]).toMatchObject({ key: "2026-11-01", total: 500, met: false });
    expect(days[0].key).toBe("2026-10-29");
  });
});

describe("streak", () => {
  const goal = 2000;

  it("is 0 for an empty log", () => {
    expect(streak({}, new Date(2026, 10, 4, 12).getTime(), goal)).toBe(0);
  });

  it("counts yesterday and the day before with today unmet", () => {
    const now = new Date(2026, 10, 4, 12).getTime();
    const log: Log = {
      "2026-11-03": [entry("2026-11-03T08:00:00Z", 2000)],
      "2026-11-02": [entry("2026-11-02T08:00:00Z", 2100)],
    };
    expect(streak(log, now, goal)).toBe(2);
  });

  it("includes today when met", () => {
    const now = new Date(2026, 10, 4, 12).getTime();
    const log: Log = {
      "2026-11-04": [entry("2026-11-04T08:00:00Z", 2000)],
      "2026-11-03": [entry("2026-11-03T08:00:00Z", 2000)],
      "2026-11-02": [entry("2026-11-02T08:00:00Z", 2000)],
    };
    expect(streak(log, now, goal)).toBe(3);
  });

  it("breaks on a gap", () => {
    const now = new Date(2026, 10, 4, 12).getTime();
    const log: Log = {
      "2026-11-03": [entry("2026-11-03T08:00:00Z", 2000)],
      "2026-11-01": [entry("2026-11-01T08:00:00Z", 2000)],
    };
    expect(streak(log, now, goal)).toBe(1);
  });

  it("is 1 for today-only", () => {
    const now = new Date(2026, 10, 4, 12).getTime();
    const log: Log = { "2026-11-04": [entry("2026-11-04T08:00:00Z", 2000)] };
    expect(streak(log, now, goal)).toBe(1);
  });

  it("counts a run across the DST-end week", () => {
    const now = withTimeZone("Europe/London", () => new Date(2026, 9, 26, 12).getTime());
    const log: Log = {};
    for (const key of ["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"]) {
      log[key] = [entry(`${key}T08:00:00Z`, 2000)];
    }
    expect(withTimeZone("Europe/London", () => streak(log, now, goal))).toBe(4);
  });
});

describe("latestEntryAt", () => {
  it("returns the most recent timestamp or null", () => {
    expect(latestEntryAt({})).toBeNull();
    const log: Log = {
      "2026-11-03": [entry("2026-11-03T20:00:00Z", 250)],
      "2026-11-04": [entry("2026-11-04T08:00:00Z", 250), entry("2026-11-04T09:00:00Z", 250)],
    };
    expect(latestEntryAt(log)).toBe("2026-11-04T09:00:00Z");
  });
});
