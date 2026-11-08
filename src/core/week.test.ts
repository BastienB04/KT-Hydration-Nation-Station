import { describe, expect, it } from "vitest";
import type { Log } from "./schema";
import { lastSevenDays, streak } from "./stats";
import { streakCaption, weekSummary } from "./week";

// Today is Fri 6 Nov 2026 (GMT); the window runs Sat 31 Oct .. Fri 6 Nov.
const NOW = new Date(2026, 10, 6, 15, 0).getTime();
const GOAL = 2000;
const KEYS = ["2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"];

function logOf(totals: number[], keys = KEYS): Log {
  const log: Log = {};
  totals.forEach((ml, i) => {
    if (ml > 0) log[keys[i]] = [{ t: `${keys[i]}T12:00:00.000Z`, ml }];
  });
  return log;
}

function caption(log: Log): string {
  return streakCaption(lastSevenDays(log, NOW, GOAL), streak(log, NOW, GOAL));
}

// Sat 1,400 · Sun 2,100 · Mon 1,750 · Tue 2,000 · Wed 2,250 · Thu 2,050 · Fri 950.
const SAMPLE = [1400, 2100, 1750, 2000, 2250, 2050, 950];

describe("weekSummary", () => {
  it("counts met days and averages over all seven days including today", () => {
    expect(weekSummary(lastSevenDays(logOf(SAMPLE), NOW, GOAL))).toEqual({ metCount: 4, averageMl: 1786 });
  });

  it("includes a met today in the count", () => {
    const totals = [...SAMPLE.slice(0, 6), 2000];
    expect(weekSummary(lastSevenDays(logOf(totals), NOW, GOAL)).metCount).toBe(5);
  });
});

describe("streakCaption", () => {
  it("names the run ending yesterday when today is not met yet", () => {
    expect(caption(logOf(SAMPLE))).toBe("Tue, Wed and Thu in a row.");
  });

  it("ends the run today once today is met", () => {
    expect(caption(logOf([...SAMPLE.slice(0, 6), 2000]))).toBe("Tue, Wed, Thu and today in a row.");
  });

  it("uses a range for runs of five to seven days", () => {
    expect(caption(logOf([1400, 1000, 2000, 2000, 2000, 2000, 2000]))).toBe("Mon to today in a row.");
  });

  it("has an encouraging line with no streak", () => {
    expect(caption(logOf([2000, 2000, 2000, 2000, 2000, 0, 0]))).toBe(
      "No streak yet: today's a good day to start.",
    );
  });

  it("names a single day", () => {
    expect(caption(logOf([0, 0, 0, 0, 0, 2000, 500]))).toBe("Thu met the goal.");
    expect(caption(logOf([0, 0, 0, 0, 0, 0, 2000]))).toBe("Today met the goal.");
  });

  it("counts runs longer than the window", () => {
    const keys = ["2026-10-29", "2026-10-30", ...KEYS];
    const log = logOf([2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000], keys);
    expect(caption(log)).toBe("9 days in a row.");
  });
});
