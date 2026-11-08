import type { Updater } from "./types";

/** Preview and development platforms never contact a release server. */
export function createUnavailableUpdater(): Updater {
  return {
    supported: false,
    async check() {
      return null;
    },
    async relaunch() {
      throw new Error("Updates are unavailable on this platform.");
    },
  };
}
