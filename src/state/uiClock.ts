/**
 * One coarse shared clock for UI that changes with time alone: a pause ending
 * or active hours ending changes Ribbit's pose and the reminder line without
 * any store change. Separate from the controller's scheduler (it never
 * evaluates or fires reminders); components just re-render and read
 * Date.now(). One interval runs while anything subscribes and stops with the
 * last unsubscribe. The snapshot is a tick counter, so it only changes on a
 * tick and subscribing never forces an extra render.
 */
export const UI_CLOCK_MS = 30_000;

export interface UiClock {
  subscribe(onTick: () => void): () => void;
  getSnapshot(): number;
}

export function createUiClock(intervalMs = UI_CLOCK_MS): UiClock {
  const listeners = new Set<() => void>();
  let id: ReturnType<typeof setInterval> | null = null;
  let ticks = 0;
  function tick(): void {
    ticks += 1;
    // Copy so a listener that unsubscribes mid-notify does not skip others.
    for (const listener of [...listeners]) listener();
  }
  function subscribe(onTick: () => void): () => void {
    listeners.add(onTick);
    if (id === null) id = globalThis.setInterval(tick, intervalMs);
    return () => {
      listeners.delete(onTick);
      if (listeners.size === 0 && id !== null) {
        globalThis.clearInterval(id);
        id = null;
      }
    };
  }
  function getSnapshot(): number {
    return ticks;
  }
  return { subscribe, getSnapshot };
}

export const uiClock = createUiClock();
