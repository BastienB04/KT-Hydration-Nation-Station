/**
 * Bundled hydration tips in Ribbit's voice and a deterministic rotation.
 * No network, no numbers, medically conservative (see tips.test.ts).
 */
import tips from "../data/tips.json";

export const TIPS: readonly string[] = tips;

export const FLUID_DISCLAIMER =
  "Tips are general, not medical advice. If a clinician has told you to limit fluids, follow their advice and set your goal with them.";

/** Tip at an index, wrapping for negative or overflow values. */
export function tipAt(index: number): string {
  const n = TIPS.length;
  return TIPS[((index % n) + n) % n];
}

/** Next index in the rotation; never equal to the current index when n >= 2. */
export function nextTipIndex(index: number): number {
  return (index + 1) % TIPS.length;
}
