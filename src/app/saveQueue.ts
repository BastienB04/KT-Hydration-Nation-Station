/**
 * Serializes saves so only one write runs at a time. While a save is in flight,
 * only the latest data is kept and written next, which coalesces bursts without
 * dropping the final state or reordering writes.
 */
import type { PersistedData } from "../core/schema";
import type { Persistence } from "../platform/types";

export interface SaveQueue {
  schedule(data: PersistedData): void;
  /** Resolves once no save is in flight and nothing is pending. */
  flush(): Promise<void>;
}

export function createSaveQueue(
  persistence: Persistence,
  onResult: (error: unknown | null) => void,
): SaveQueue {
  let pending: PersistedData | null = null;
  let running: Promise<void> | null = null;

  function run(): Promise<void> {
    running = (async () => {
      while (pending !== null) {
        const data = pending;
        pending = null;
        try {
          await persistence.save(data);
          onResult(null);
        } catch (error) {
          onResult(error);
        }
      }
      running = null;
    })();
    return running;
  }

  return {
    schedule(data: PersistedData) {
      pending = data;
      if (running === null) void run();
    },
    async flush() {
      while (running !== null) await running;
    },
  };
}
