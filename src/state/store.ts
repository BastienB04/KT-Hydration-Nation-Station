/**
 * A tiny external store read through React's useSyncExternalStore. dispatch
 * reduces synchronously and only notifies when the root reference changes, so
 * the scheduler, tray handlers and saves always see fresh state.
 */
import { reduce, type Action, type RootState } from "./reducer";

export interface AppStore {
  getState(): RootState;
  dispatch(action: Action): void;
  subscribe(listener: () => void): () => void;
}

export function createAppStore(initial: RootState): AppStore {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    dispatch(action) {
      const next = reduce(state, action);
      if (next === state) return;
      state = next;
      // Copy so a listener that unsubscribes mid-notify does not skip others.
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
