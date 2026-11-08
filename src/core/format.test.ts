import { describe, expect, it } from "vitest";
import {
  buildTooltip,
  formatClock,
  formatDayLabel,
  formatDayLong,
  formatMl,
  formatWeekdayShort,
} from "./format";
import type { Decision } from "./scheduler";

describe("formatMl", () => {
  it("groups thousands", () => {
    expect(formatMl(1250)).toBe("1,250");
    expect(formatMl(0)).toBe("0");
  });
});

describe("formatClock", () => {
  it("zero-pads the local time", () => {
    const ms = new Date(2026, 10, 4, 9, 5).getTime();
    expect(formatClock(ms)).toBe("09:05");
  });
});

describe("formatDayLabel", () => {
  it("formats a weekday label", () => {
    expect(formatDayLabel("2026-11-04")).toBe("Wed 4 Nov");
  });
});

describe("formatWeekdayShort", () => {
  it("gives the short weekday name for a local date key", () => {
    expect(formatWeekdayShort("2026-11-03")).toBe("Tue");
    expect(formatWeekdayShort("2026-11-08")).toBe("Sun");
    expect(formatWeekdayShort("2026-10-25")).toBe("Sun"); // DST change day
  });
});

describe("formatDayLong", () => {
  it("gives the full weekday, day and short month", () => {
    expect(formatDayLong("2026-11-03")).toBe("Tuesday 3 Nov");
    expect(formatDayLong("2026-10-25")).toBe("Sunday 25 Oct");
  });
});
describe("buildTooltip", () => {
  const due = new Date(2026, 10, 4, 14, 30).getTime();

  const cases: Array<[Decision, string]> = [
    [{ kind: "setup-incomplete" }, "Ribbit · 1,250 / 2,000 ml · setup pending"],
    [{ kind: "paused", until: due }, "Ribbit · 1,250 / 2,000 ml · paused until 14:30"],
    [{ kind: "inactive-day" }, "Ribbit · 1,250 / 2,000 ml · resting"],
    [{ kind: "outside-hours" }, "Ribbit · 1,250 / 2,000 ml · resting"],
    [{ kind: "goal-met" }, "Ribbit · 1,250 / 2,000 ml · goal met"],
    [{ kind: "due" }, "Ribbit · 1,250 / 2,000 ml · sip due"],
    [{ kind: "waiting", dueAt: due }, "Ribbit · 1,250 / 2,000 ml · next 14:30"],
    [{ kind: "waiting", dueAt: null }, "Ribbit · 1,250 / 2,000 ml · resting"],
  ];

  it.each(cases)("renders the %s status", (decision, expected) => {
    expect(buildTooltip("Ribbit", 1250, 2000, decision)).toBe(expected);
  });
});
