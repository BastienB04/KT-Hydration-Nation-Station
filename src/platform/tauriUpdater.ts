/** Native check sets a secure client; the plugin owns verification and install. */
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { Update } from "@tauri-apps/plugin-updater";
import { createUnavailableUpdater } from "./noUpdater";
import type { Updater } from "./types";

type Metadata = ConstructorParameters<typeof Update>[0];
const DOWNLOAD_TIMEOUT_MS = 5 * 60_000;

export async function createTauriUpdater(): Promise<Updater> {
  if (!(await invoke<boolean>("updater_supported"))) return createUnavailableUpdater();
  return {
    supported: true,
    async check() {
      const metadata = await invoke<Metadata | null>("check_for_update");
      if (metadata === null) return null;
      const update = new Update(metadata);
      return {
        version: update.version,
        async download(onProgress) {
          let downloadedBytes = 0;
          let totalBytes: number | null = null;
          await update.download((event) => {
            if (event.event === "Started") totalBytes = event.data.contentLength ?? null;
            if (event.event === "Progress") downloadedBytes += event.data.chunkLength;
            onProgress({
              downloadedBytes,
              totalBytes,
              finished: event.event === "Finished",
            });
          }, { timeout: DOWNLOAD_TIMEOUT_MS });
        },
        async install() {
          await update.install({ restartAfterInstall: true });
        },
        close: () => update.close(),
      };
    },
    relaunch,
  };
}
