/**
 * In-memory persistence, used by the browser fallback and by tests. Saves and
 * loads deep-copy through JSON so callers never share mutable references.
 */
import type { PersistedData } from "../core/schema";
import type { Persistence } from "./types";

export function createMemoryPersistence(initial?: unknown): Persistence {
  let stored: unknown = initial === undefined ? undefined : JSON.parse(JSON.stringify(initial));
  return {
    async load() {
      return stored === undefined ? undefined : JSON.parse(JSON.stringify(stored));
    },
    async save(data: PersistedData) {
      stored = JSON.parse(JSON.stringify(data));
    },
  };
}
