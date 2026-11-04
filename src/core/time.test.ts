import { describe, expect, it } from "vitest";
import { withTimeZone } from "../test/tz";
import {
  addDays,
  atLocalMinutes,
  dateKeyOf,
  isoWeekday,
  isValidDateKey,
  lastNDateKeys,
  minutesOfDay,
  parseHHMM,
  parseIso,
} from "./time";

describe("dateKeyOf", () => {
  it("keys a late-evening drink to the local day in London", () => {
    // 2026-11-04 23:30 local (GMT in November) = 23:30 UTC.
    const ms = Date.UTC(2026, 10, 4, 23, 30);
    expect(dateKeyOf(ms)).toBe("2026-11-04");
  });

  it("keys the same instant to the previous day in New York", () => {
    // 2026-11-04T23:30Z is 18:30 in New York (EST, UTC-5).
    const ms = Date.UTC(2026, 10, 4, 23, 30);
    const nyKey = withTimeZone("America/New_York", () => dateKeyOf(ms));
    expect(nyKey).toBe("2026-11-04");
    // A drink at 03:00 UTC is 22:00 the previous day in New York.
    const ms2 = Date.UTC(2026, 10, 5, 3, 0);
    const nyKey2 = withTimeZone("America/New_York", () => dateKeyOf(ms2));
    expect(nyKey2).toBe("2026-11-04");
  });

  it("changes with a timezone switch for the same instant", () => {
    const ms = Date.UTC(2026, 10, 4, 23, 30);
    const akl = withTimeZone("Pacific/Auckland", () => dateKeyOf(ms));
    expect(akl).toBe("2026-11-05");
  });
});

describe("isValidDateKey", () => {
  it("accepts a real date and rejects malformed or impossible ones", () => {
    expect(isValidDateKey("2026-11-04")).toBe(true);
    expect(isValidDateKey("2026-2-4")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
    expect(isValidDateKey(20261104)).toBe(false);
  });
});

describe("isoWeekday", () => {
  it("maps a known Monday and Sunday", () => {
    // 2026-11-02 is a Monday, 2026-11-08 is a Sunday.
    expect(isoWeekday(new Date(2026, 10, 2, 12).getTime())).toBe(1);
    expect(isoWeekday(new Date(2026, 10, 8, 12).getTime())).toBe(7);
  });
});

describe("parseHHMM", () => {
  it("accepts valid times and rejects malformed ones", () => {
    expect(parseHHMM("08:00")).toBe(480);
    expect(parseHHMM("00:00")).toBe(0);
    expect(parseHHMM("23:59")).toBe(1439);
    expect(parseHHMM("8:00")).toBeNull();
    expect(parseHHMM("24:00")).toBeNull();
    expect(parseHHMM("08:60")).toBeNull();
    expect(parseHHMM("")).toBeNull();
    expect(parseHHMM(800)).toBeNull();
  });
});

describe("atLocalMinutes across DST", () => {
  it("gives 08:00 local on London DST start and end days", () => {
    // DST start 2026-03-29 (clocks forward), DST end 2026-10-25 (clocks back).
    const startDay = new Date(2026, 2, 29, 15).getTime();
    const endDay = new Date(2026, 9, 25, 15).getTime();
    const at8start = atLocalMinutes(startDay, 480);
    const at8end = atLocalMinutes(endDay, 480);
    expect(minutesOfDay(at8start)).toBe(480);
    expect(minutesOfDay(at8end)).toBe(480);
  });
});

describe("lastNDateKeys", () => {
  it("gives 7 distinct consecutive keys across DST end", () => {
    const now = new Date(2026, 9, 25, 15).getTime();
    const keys = lastNDateKeys(now, 7);
    expect(keys).toHaveLength(7);
    expect(new Set(keys).size).toBe(7);
    expect(keys[6]).toBe("2026-10-25");
    expect(keys[0]).toBe("2026-10-19");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("parseIso", () => {
  it("parses finite ISO strings and rejects others", () => {
    expect(parseIso("2026-11-04T08:12:31Z")).toBe(Date.UTC(2026, 10, 4, 8, 12, 31));
    expect(parseIso("not-a-date")).toBeNull();
    expect(parseIso(123)).toBeNull();
    expect(parseIso(null)).toBeNull();
  });
});
