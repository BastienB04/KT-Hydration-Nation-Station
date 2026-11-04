import { describe, expect, it } from "vitest";
import { nextTipIndex, tipAt, TIPS } from "./tips";

describe("tips content", () => {
  it("has 45-60 tips", () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(45);
    expect(TIPS.length).toBeLessThanOrEqual(60);
  });

  it("are unique, trimmed, non-empty and under the length cap", () => {
    expect(new Set(TIPS).size).toBe(TIPS.length);
    for (const tip of TIPS) {
      expect(tip.length).toBeGreaterThan(0);
      expect(tip).toBe(tip.trim());
      expect(tip.length).toBeLessThanOrEqual(140);
    }
  });

  it("contain no digits", () => {
    for (const tip of TIPS) expect(tip).not.toMatch(/\d/);
  });

  it("avoid unsafe or pushy phrasing", () => {
    for (const tip of TIPS) {
      expect(tip).not.toMatch(/detox|flush|cure|everyone (needs|should)|as much as you can|chug/i);
    }
  });
});

describe("rotation", () => {
  it("nextTipIndex never equals the current index over a full cycle", () => {
    for (let i = 0; i < TIPS.length; i += 1) {
      expect(nextTipIndex(i)).not.toBe(i);
    }
  });

  it("tipAt wraps negative and overflow indexes", () => {
    expect(tipAt(0)).toBe(TIPS[0]);
    expect(tipAt(TIPS.length)).toBe(TIPS[0]);
    expect(tipAt(-1)).toBe(TIPS[TIPS.length - 1]);
  });
});
