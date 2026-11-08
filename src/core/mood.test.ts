import { describe, expect, it } from "vitest";
import { reminderUnanswered } from "./attention";
import { moodLabel, pondMood } from "./mood";
import { createDefaultData, type PersistedData } from "./schema";

// Wed 4 Nov 2026 (GMT, so local == UTC), goal 2,000 ml, reminders every 60 min.
function at(h: number, m = 0, day = 4): number {
  return new Date(2026, 10, day, h, m).getTime();
}
function iso(h: number, m = 0, day = 4): string {
  return new Date(2026, 10, day, h, m).toISOString();
}

function dataWith(ml: number, mutate?: (d: PersistedData) => void): PersistedData {
  const d = createDefaultData();
  d.settings.setupDone = true;
  if (ml > 0) {
    d.log["2026-11-04"] = [{ t: iso(9), ml }];
    d.state.lastDrinkAt = iso(9);
  }
  mutate?.(d);
  return d;
}

const NOW = at(9, 30);

describe("pondMood thresholds", () => {
  const cases: Array<[number, string]> = [
    [0, "parched"],
    [498, "parched"], // 24.9 %
    [500, "waking"], // 25 %
    [998, "waking"], // 49.9 %
    [1000, "content"], // 50 %
    [1498, "content"], // 74.9 %
    [1500, "happy"], // 75 %
    [1998, "happy"], // 99.9 %
    [2000, "hydrated"], // 100 %
  ];
  it.each(cases)("%i ml -> %s", (ml, pose) => {
    expect(pondMood(dataWith(ml), NOW)).toBe(pose);
  });
});

describe("pondMood states", () => {
  it("sleeps while paused, even with an unanswered reminder", () => {
    const d = dataWith(500, (x) => {
      x.state.pausedUntil = iso(11);
      x.state.lastReminderAt = iso(10);
    });
    expect(pondMood(d, at(10, 5))).toBe("sleeping");
  });

  it("waits for a sip after a reminder fired today with no drink since", () => {
    const d = dataWith(500, (x) => {
      x.state.lastReminderAt = iso(10);
    });
    expect(reminderUnanswered(d, at(10, 5))).toBe(true);
    expect(pondMood(d, at(10, 5))).toBe("reminder");
  });

  it("clears the reminder once a drink is logged after it", () => {
    const d = dataWith(500, (x) => {
      x.state.lastReminderAt = iso(10);
      x.log["2026-11-04"].push({ t: iso(10, 2), ml: 100 });
      x.state.lastDrinkAt = iso(10, 2);
    });
    expect(reminderUnanswered(d, at(10, 5))).toBe(false);
    expect(pondMood(d, at(10, 5))).toBe("waking");
  });

  it("changes with time alone: a pause ending and active hours ending", () => {
    const paused = dataWith(500, (x) => {
      x.state.pausedUntil = iso(10);
    });
    expect(pondMood(paused, at(9, 59))).toBe("sleeping");
    expect(pondMood(paused, at(10, 0))).toBe("waking");
    const waiting = dataWith(500, (x) => {
      x.state.lastReminderAt = iso(21, 30);
    });
    expect(pondMood(waiting, at(21, 50))).toBe("reminder");
    expect(pondMood(waiting, at(22, 5))).toBe("waking");
  });

  it("ignores a reminder from yesterday", () => {
    const d = dataWith(0, (x) => {
      x.state.lastReminderAt = iso(21, 0, 3);
    });
    expect(reminderUnanswered(d, at(10, 5))).toBe(false);
    expect(pondMood(d, at(10, 5))).toBe("parched");
  });

  it("prefers hydrated over an unanswered reminder", () => {
    const d = dataWith(2000, (x) => {
      x.state.lastReminderAt = iso(10);
    });
    expect(reminderUnanswered(d, at(10, 5))).toBe(false);
    expect(pondMood(d, at(10, 5))).toBe("hydrated");
  });

  it("never reports unanswered before setup", () => {
    const d = dataWith(0, (x) => {
      x.settings.setupDone = false;
      x.state.lastReminderAt = iso(10);
    });
    expect(reminderUnanswered(d, at(10, 5))).toBe(false);
  });
});

describe("moodLabel", () => {
  it("names the frog in each label", () => {
    expect(moodLabel("parched", "Hopkins")).toBe("Hopkins is thirsty");
    expect(moodLabel("hydrated", "Ribbit")).toBe("Goal met. Ribbit is delighted.");
    expect(moodLabel("reminder", "Ribbit")).toBe("Ribbit is waiting for a sip");
    expect(moodLabel("sleeping", "Ribbit")).toBe("Ribbit is napping");
  });
});
