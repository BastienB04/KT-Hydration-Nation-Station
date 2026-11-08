import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pondMood } from "../core/mood";
import { createDefaultData, type PersistedData } from "../core/schema";
import { createUiClock, UI_CLOCK_MS } from "./uiClock";

// Wed 4 Nov 2026 (GMT, so local == UTC), goal 2,000 ml, active 08:00-22:00.
function iso(h: number, m = 0, s = 0): string {
  return new Date(2026, 10, 4, h, m, s).toISOString();
}

function frozenData(mutate: (d: PersistedData) => void): PersistedData {
  const d = createDefaultData();
  d.settings.setupDone = true;
  d.log["2026-11-04"] = [{ t: iso(9), ml: 500 }];
  d.state.lastDrinkAt = iso(9);
  mutate(d);
  return Object.freeze(d);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createUiClock", () => {
  it("notifies a subscriber every 30 s and advances the snapshot", () => {
    const clock = createUiClock();
    const onTick = vi.fn();
    const unsubscribe = clock.subscribe(onTick);
    expect(clock.getSnapshot()).toBe(0);
    vi.advanceTimersByTime(UI_CLOCK_MS - 1);
    expect(onTick).not.toHaveBeenCalled();
    expect(clock.getSnapshot()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(clock.getSnapshot()).toBe(1);
    unsubscribe();
  });

  it("shares one interval between subscribers and stops after the last leaves", () => {
    const clock = createUiClock();
    const a = vi.fn();
    const b = vi.fn();
    const offA = clock.subscribe(a);
    const offB = clock.subscribe(b);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(UI_CLOCK_MS);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    expect(vi.getTimerCount()).toBe(1);
    offB();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(UI_CLOCK_MS * 3);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("keeps exactly one timer through unsubscribe and resubscribe (StrictMode)", () => {
    const clock = createUiClock();
    const onTick = vi.fn();
    clock.subscribe(onTick)();
    expect(vi.getTimerCount()).toBe(0);
    const off = clock.subscribe(onTick);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(UI_CLOCK_MS);
    expect(onTick).toHaveBeenCalledTimes(1);
    off();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("drives Ribbit's pose past a pause expiry without a store change", () => {
    vi.setSystemTime(new Date(2026, 10, 4, 10, 0));
    const data = frozenData((d) => {
      d.state.pausedUntil = iso(10, 0, 45);
    });
    const before = JSON.stringify(data);
    const clock = createUiClock();
    let pose = pondMood(data, Date.now());
    const off = clock.subscribe(() => {
      pose = pondMood(data, Date.now());
    });
    expect(pose).toBe("sleeping");
    vi.advanceTimersByTime(UI_CLOCK_MS);
    expect(pose).toBe("sleeping");
    vi.advanceTimersByTime(UI_CLOCK_MS);
    expect(pose).toBe("waking");
    expect(JSON.stringify(data)).toBe(before);
    off();
  });

  it("clears the reminder pose when active hours end", () => {
    vi.setSystemTime(new Date(2026, 10, 4, 21, 59, 45));
    const data = frozenData((d) => {
      d.state.lastReminderAt = iso(21, 30);
    });
    const clock = createUiClock();
    let pose = pondMood(data, Date.now());
    const off = clock.subscribe(() => {
      pose = pondMood(data, Date.now());
    });
    expect(pose).toBe("reminder");
    vi.advanceTimersByTime(UI_CLOCK_MS);
    expect(pose).toBe("waking");
    off();
  });
});
