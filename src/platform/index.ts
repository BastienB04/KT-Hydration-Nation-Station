/**
 * Picks the platform at runtime. Under Tauri it dynamically imports ./tauri so
 * the browser bundle never evaluates the Tauri APIs, and installs the
 * close-to-tray handler. dispose() tears both down.
 */
import { isTauri } from "@tauri-apps/api/core";
import { createBrowserPlatform } from "./browser";
import type { Platform } from "./types";

export async function createPlatform(): Promise<Platform & { dispose(): void }> {
  if (!isTauri()) {
    return createBrowserPlatform();
  }

  const { createTauriPlatform, installCloseToTray } = await import("./tauri");
  const platform = await createTauriPlatform();
  const unlistenClose = await installCloseToTray();
  const baseDispose = platform.dispose;
  return {
    ...platform,
    dispose() {
      unlistenClose();
      baseDispose();
    },
  };
}
