/**
 * Browser platform for `npm run dev` + Chrome. Persists to localStorage (with a
 * memory fallback), uses the Web Notification API when present, and replaces
 * the Rust tick with a setInterval. Tray and autostart are no-ops.
 */
import type { PersistedData } from "../core/schema";
import { createMemoryPersistence } from "./memory";
import { createWebAudioSound } from "./sound";
import type { Platform, Persistence } from "./types";

const STORE_KEY = "kt-hns:store";
const TICK_MS = 30_000;

function createBrowserPersistence(): Persistence {
  const memory = createMemoryPersistence();
  let usable = true;
  try {
    // Probe access; some privacy modes throw on read/write.
    window.localStorage.getItem(STORE_KEY);
  } catch {
    usable = false;
  }
  if (!usable) return memory;

  return {
    async load() {
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        return raw === null ? undefined : JSON.parse(raw);
      } catch {
        return memory.load();
      }
    },
    async save(data: PersistedData) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch {
        await memory.save(data);
      }
    },
  };
}

export function createBrowserPlatform(): Platform & { dispose(): void } {
  const sound = createWebAudioSound();
  let denied = false;

  const platform: Platform & { dispose(): void } = {
    kind: "browser",
    persistence: createBrowserPersistence(),
    notifier: {
      async ensurePermission() {
        const N = (window as { Notification?: typeof Notification }).Notification;
        if (!N) return false;
        if (N.permission === "granted") return true;
        if (N.permission === "denied") return false;
        try {
          const result = await N.requestPermission();
          return result === "granted";
        } catch {
          return false;
        }
      },
      async send(title, body) {
        const N = (window as { Notification?: typeof Notification }).Notification;
        if (!N || denied) return false;
        if (N.permission !== "granted") {
          const ok = await this.ensurePermission();
          if (!ok) {
            denied = true;
            return false;
          }
        }
        try {
          new N(title, { body });
          return true;
        } catch {
          return false;
        }
      },
    },
    sound,
    autostart: {
      supported: false,
      async isEnabled() {
        return false;
      },
      async setEnabled() {
        // No-op in the browser.
      },
    },
    tray: {
      async setTooltip() {
        // No tray in the browser.
      },
    },
    events: {
      async onTick(cb) {
        const id = window.setInterval(cb, TICK_MS);
        return () => window.clearInterval(id);
      },
      async onWake(cb) {
        const onFocus = () => cb();
        const onVisible = () => {
          if (document.visibilityState === "visible") cb();
        };
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
          window.removeEventListener("focus", onFocus);
          document.removeEventListener("visibilitychange", onVisible);
        };
      },
      async onTrayLog() {
        return () => {};
      },
      async onTrayPause() {
        return () => {};
      },
      async onNotificationOpen() {
        return () => {};
      },
    },
    dispose() {
      sound.dispose();
    },
  };

  return platform;
}
