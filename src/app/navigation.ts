/**
 * Shell screen ids and the one navigation rule that comes from outside the
 * Shell: clicking a reminder notification always lands on Pond, ready to log.
 */
import type { Controller } from "./controller";

export type Screen = "home" | "history" | "settings" | "about";

/** The Pond screen (nav label "Pond"). */
export const POND_SCREEN: Screen = "home";

/**
 * Select Pond whenever a reminder notification is clicked. Returns the
 * unsubscribe function, so it can be the body of a React effect.
 */
export function openPondOnNotification(
  controller: Pick<Controller, "onNotificationOpen">,
  select: (screen: Screen) => void,
): () => void {
  return controller.onNotificationOpen(() => select(POND_SCREEN));
}
