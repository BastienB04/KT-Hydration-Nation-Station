/**
 * Ribbit, inlined from the original SVGs in src/assets/ribbit.
 * - variant "peek" crops to the head and chest for peeking over a card edge,
 *   "full" shows the whole 512 box, "thumb" a small square around the body.
 * - With `label` the frog is an image with that accessible name; without it
 *   the frog is decorative and hidden from assistive technology.
 * - `animate` enables the idle bob/blink in ribbit.css (always off under
 *   prefers-reduced-motion).
 */
import type { RibbitPose } from "../core/mood";
import { ribbitMarkup, type RibbitVariant } from "./ribbitArt";

interface RibbitProps {
  pose: RibbitPose;
  variant?: RibbitVariant;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function Ribbit({ pose, variant = "full", label, animate = true, className }: RibbitProps) {
  const classes = ["ribbit-art", `ribbit-art--${variant}`, `ribbit-art--${pose}`];
  if (animate) classes.push("ribbit-art--animate");
  if (className) classes.push(className);
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <span
      className={classes.join(" ")}
      {...a11y}
      // Repo-owned build-time SVG constants only; see ribbitArt.test.ts.
      dangerouslySetInnerHTML={{ __html: ribbitMarkup(pose, variant) }}
    />
  );
}
