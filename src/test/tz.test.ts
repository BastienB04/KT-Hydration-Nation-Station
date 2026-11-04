import { describe, expect, it } from "vitest";
import { withTimeZone } from "./tz";

describe("test timezone harness", () => {
  it("runs under Europe/London by default", () => {
    // 2026-07-01 is British Summer Time (UTC+1), so 12:00 UTC is 13:00 local.
    expect(new Date(Date.UTC(2026, 6, 1, 12)).getHours()).toBe(13);
  });

  it("switches zones inside withTimeZone and restores after", () => {
    const auckland = withTimeZone("Pacific/Auckland", () =>
      // 2026-07-01 is NZ winter (UTC+12), so 12:00 UTC is 00:00 next day local.
      new Date(Date.UTC(2026, 6, 1, 12)).getHours(),
    );
    expect(auckland).toBe(0);
    // Restored to London.
    expect(new Date(Date.UTC(2026, 6, 1, 12)).getHours()).toBe(13);
  });
});
