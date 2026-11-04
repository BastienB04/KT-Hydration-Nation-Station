/**
 * Test-only timezone helper. Never imported by application code.
 *
 * Node 22 applies runtime `TZ` changes to subsequent `Date` operations, so a
 * test can run a block in a specific zone and restore the previous value after.
 */
declare const process: { env: Record<string, string | undefined> };

export function withTimeZone<T>(tz: string, fn: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    process.env.TZ = previous;
  }
}
