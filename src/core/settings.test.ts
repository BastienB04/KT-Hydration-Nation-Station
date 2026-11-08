import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./schema";
import {
  draftFromSettings,
  normalizeSettings,
  parseAmount,
  parseGoal,
  stepGoal,
  validateSettingsDraft,
} from "./settings";

describe("parseGoal (first-run setup goal)", () => {
  it("accepts the full 100–10,000 ml goal range, not the per-sip cap", () => {
    expect(parseGoal("100")).toBe(100);
    expect(parseGoal("5001")).toBe(5001);
    expect(parseGoal(" 10000 ")).toBe(10000);
  });

  it("rejects out-of-range and malformed goals", () => {
    expect(parseGoal("99")).toBeNull();
    expect(parseGoal("10001")).toBeNull();
    expect(parseGoal("")).toBeNull();
    expect(parseGoal("2.5")).toBeNull();
    expect(parseGoal("-500")).toBeNull();
  });
});

describe("stepGoal (goal -/+ buttons)", () => {
  it("clamps to the goal limits and steps from the default on bad text", () => {
    expect(stepGoal("100", -100)).toBe("100");
    expect(stepGoal("9950", 100)).toBe("10000");
    expect(stepGoal("abc", 100)).toBe("2100");
    expect(stepGoal("2050", 100)).toBe("2150");
    expect(stepGoal("2050", -100)).toBe("1950");
  });
});
describe("normalizeSettings theme", () => {
  it("keeps exact modes and defaults anything else to system", () => {
    for (const mode of ["system", "light", "dark"] as const) {
      expect(normalizeSettings({ theme: mode }).theme).toBe(mode);
    }
    for (const junk of ["Dark", "LIGHT", 1, null, {}, "auto", undefined]) {
      expect(normalizeSettings({ theme: junk }).theme).toBe("system");
    }
  });
  it("validateSettingsDraft never carries a theme", () => {
    const result = validateSettingsDraft(draftFromSettings({ ...DEFAULT_SETTINGS, theme: "dark", setupDone: true }));
    expect(result.ok && "theme" in result.settings).toBe(false);
  });
});
describe("parseAmount", () => {
  it("accepts and rejects the expected inputs", () => {
    expect(parseAmount("")).toEqual({ ok: false, error: expect.any(String) });
    expect(parseAmount("0").ok).toBe(false);
    expect(parseAmount("-5").ok).toBe(false);
    expect(parseAmount("2.5").ok).toBe(false);
    expect(parseAmount("1e3").ok).toBe(false);
    expect(parseAmount(" 250 ")).toEqual({ ok: true, ml: 250 });
    expect(parseAmount("5001").ok).toBe(false);
    expect(parseAmount("5000")).toEqual({ ok: true, ml: 5000 });
  });
});

describe("validateSettingsDraft", () => {
  const base = draftFromSettings({ ...DEFAULT_SETTINGS, setupDone: true });

  it("round-trips a valid draft", () => {
    const result = validateSettingsDraft(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settings.dailyGoalMl).toBe(2000);
      expect(result.settings.quickAddMl).toEqual([150, 250, 500]);
      expect(result.settings.setupDone).toBe(true);
    }
  });

  it("flags each bad field", () => {
    const result = validateSettingsDraft({
      ...base,
      dailyGoalMl: "5",
      quickAddMl: ["0", "250", "9999"],
      reminderEveryMin: "999",
      snoozeMin: "x",
      frogName: "   ",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.dailyGoalMl).toBeDefined();
      expect(result.errors["quickAddMl.0"]).toBeDefined();
      expect(result.errors["quickAddMl.2"]).toBeDefined();
      expect(result.errors.reminderEveryMin).toBeDefined();
      expect(result.errors.snoozeMin).toBeDefined();
      expect(result.errors.frogName).toBeDefined();
    }
  });

  it("rejects end <= start", () => {
    const result = validateSettingsDraft({
      ...base,
      activeHours: { start: "22:00", end: "08:00" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.activeHours).toBeDefined();
  });

  it("rejects an empty day list", () => {
    const result = validateSettingsDraft({ ...base, activeDays: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.activeDays).toBeDefined();
  });
});

describe("normalizeSettings", () => {
  it("returns defaults for non-objects", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it("fills in missing fields and replaces wrong types", () => {
    const s = normalizeSettings({ dailyGoalMl: 2500, soundEnabled: "yes" });
    expect(s.dailyGoalMl).toBe(2500);
    expect(s.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
    expect(s.quickAddMl).toEqual([150, 250, 500]);
  });

  it("dedupes, filters and sorts active days; empty becomes default", () => {
    expect(normalizeSettings({ activeDays: [3, 3, 1, 9, 0, 2] }).activeDays).toEqual([1, 2, 3]);
    expect(normalizeSettings({ activeDays: [] }).activeDays).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("falls back on inverted or malformed hours", () => {
    expect(normalizeSettings({ activeHours: { start: "22:00", end: "08:00" } }).activeHours).toEqual(
      DEFAULT_SETTINGS.activeHours,
    );
    expect(normalizeSettings({ activeHours: { start: "nope", end: "x" } }).activeHours).toEqual(
      DEFAULT_SETTINGS.activeHours,
    );
  });

  it("truncates a long frog name and defaults a blank one", () => {
    expect(normalizeSettings({ frogName: "   " }).frogName).toBe("Ribbit");
    expect(normalizeSettings({ frogName: "x".repeat(40) }).frogName).toHaveLength(24);
  });

  it("clamps out-of-range numbers to defaults", () => {
    expect(normalizeSettings({ dailyGoalMl: 50 }).dailyGoalMl).toBe(2000);
    expect(normalizeSettings({ reminderEveryMin: 9000 }).reminderEveryMin).toBe(60);
  });
});
