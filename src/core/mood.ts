/**
 * Maps hydration state to a Ribbit pose and its accessible label. Pure.
 */
import { reminderUnanswered } from "./attention";
import type { PersistedData } from "./schema";
import { progress, todayTotal } from "./stats";
import { parseIso } from "./time";

export type RibbitPose =
  | "parched"
  | "waking"
  | "content"
  | "happy"
  | "hydrated"
  | "sleeping"
  | "reminder"
  | "wave"
  | "celebrate"
  | "base";

/** Steady-state pose for the Pond card (the one-shot celebrate is separate). */
export function pondMood(data: PersistedData, now: number): RibbitPose {
  const pausedUntil = parseIso(data.state.pausedUntil);
  if (pausedUntil !== null && now < pausedUntil) return "sleeping";
  const total = todayTotal(data.log, now);
  const goal = data.settings.dailyGoalMl;
  if (total >= goal) return "hydrated";
  if (reminderUnanswered(data, now)) return "reminder";
  const fraction = progress(total, goal);
  if (fraction < 0.25) return "parched";
  if (fraction < 0.5) return "waking";
  if (fraction < 0.75) return "content";
  return "happy";
}

export function moodLabel(pose: RibbitPose, name: string): string {
  switch (pose) {
    case "parched":
      return `${name} is thirsty`;
    case "waking":
      return `${name} is waking up`;
    case "content":
      return `${name} is content`;
    case "happy":
      return `${name} is happy`;
    case "hydrated":
      return `Goal met. ${name} is delighted.`;
    case "sleeping":
      return `${name} is napping`;
    case "reminder":
      return `${name} is waiting for a sip`;
    case "celebrate":
      return `${name} is cheering`;
    case "wave":
      return `${name} is waving hello`;
    case "base":
      return `${name} the frog`;
  }
}
