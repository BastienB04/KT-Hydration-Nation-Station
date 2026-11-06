/**
 * Tauri platform. Everything that touches the Rust shell or a plugin lives
 * here. This module is only imported dynamically (see ./index.ts) so the
 * browser preview never evaluates the Tauri APIs.
 */
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { load, type Store } from "@tauri-apps/plugin-store";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import type { PersistedData } from "../core/schema";
import { createWebAudioSound } from "./sound";
import type { Platform } from "./types";

const STORE_FILE = "store.json";
/**
 * Must match `REMINDER_ACTION_TYPE` in `src-tauri/src/lib.rs`. Rust registers it
 * on macOS only (an "Open" button, needed there for body clicks to be reported);
 * on Windows the id is unregistered, so the plugin ignores it and the toast stays plain.
 */
const REMINDER_ACTION_TYPE = "reminder";
/** Emitted by Rust after a reminder notification is clicked. */
const NOTIFICATION_OPEN_EVENT = "notification-open";

function positiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

/** Hide the window on close instead of quitting (F-10). Returns an unlistener. */
export async function installCloseToTray(): Promise<() => void> {
  const win = getCurrentWindow();
  return win.onCloseRequested(async (event) => {
    event.preventDefault();
    await win.hide();
  });
}

export function createTauriPlatform(): Platform & { dispose(): void } {
  const sound = createWebAudioSound();
  let storePromise: Promise<Store> | null = null;
  let permissionDenied = false;

  function getStore(): Promise<Store> {
    if (storePromise === null) storePromise = load(STORE_FILE, { autoSave: false });
    return storePromise;
  }

  const platform: Platform & { dispose(): void } = {
    kind: "tauri",
    persistence: {
      async load() {
        const store = await getStore();
        return Object.fromEntries(await store.entries());
      },
      async save(data: PersistedData) {
        const store = await getStore();
        await store.set("schemaVersion", data.schemaVersion);
        await store.set("settings", data.settings);
        await store.set("state", data.state);
        await store.set("log", data.log);
        await store.save();
      },
    },
    notifier: {
      async ensurePermission() {
        if (permissionDenied) return false;
        let granted = await isPermissionGranted();
        if (!granted) granted = (await requestPermission()) === "granted";
        if (!granted) permissionDenied = true;
        return granted;
      },
      async send(title, body) {
        const ok = await this.ensurePermission();
        if (!ok) return false;
        try {
          sendNotification({ title, body, actionTypeId: REMINDER_ACTION_TYPE });
          return true;
        } catch {
          return false;
        }
      },
    },
    sound,
    autostart: {
      supported: true,
      isEnabled,
      async setEnabled(on: boolean) {
        if (on) await enable();
        else await disable();
      },
    },
    tray: {
      async setTooltip(text: string) {
        await invoke("set_tray_tooltip", { text });
      },
    },
    events: {
      async onTick(cb) {
        return listen("tick", () => cb());
      },
      async onWake(cb) {
        const win = getCurrentWindow();
        const unFocus = await win.onFocusChanged(({ payload }) => {
          if (payload) cb();
        });
        const onVisible = () => {
          if (document.visibilityState === "visible") cb();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
          unFocus();
          document.removeEventListener("visibilitychange", onVisible);
        };
      },
      async onTrayLog(cb) {
        return listen<number>("tray-log", ({ payload }) => {
          const ml = positiveInt(payload);
          if (ml !== null) cb(ml);
        });
      },
      async onTrayPause(cb) {
        return listen<number>("tray-pause", ({ payload }) => {
          const minutes = positiveInt(payload);
          if (minutes !== null) cb(minutes);
        });
      },
      async onNotificationOpen(cb) {
        return listen(NOTIFICATION_OPEN_EVENT, () => cb());
      },
    },
    dispose() {
      sound.dispose();
    },
  };

  return platform;
}
