import { defineConfig } from "vitest/config";
// @ts-expect-error type error without @types/node package
import process from "node:process";

// Pin the test timezone so local-date and active-hours logic is deterministic.
// Individual tests switch zones with the withTimeZone helper in src/test/tz.ts.
process.env.TZ = "Europe/London";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: { TZ: "Europe/London" },
  },
});
