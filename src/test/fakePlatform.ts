/**
 * Test-only in-memory platform. Records side effects and lets a test emit
 * ticks, wakes and tray actions. Never imported by application code.
 */
import { createMemoryPersistence } from "../platform/memory";
import type { Platform } from "../platform/types";

export interface FakePlatformOptions {
  initial?: unknown;
  granted?: boolean;
  autostartSupported?: boolean;
  autostartEnabled?: boolean;
  autostartThrows?: boolean;
}

export interface FakePlatformHandle {
  platform: Platform;
  sent: Array<{ title: string; body: string }>;
  tooltips: string[];
  autostartCalls: boolean[];
  ribbitCount(): number;
  activeListeners(): number;
  setGranted(value: boolean): void;
  setAutostartThrows(value: boolean): void;
  emitTick(): void;
  emitWake(): void;
  emitTrayLog(ml: number): void;
  emitTrayPause(minutes: number): void;
}

export function createFakePlatform(options: FakePlatformOptions = {}): FakePlatformHandle {
  const sent: Array<{ title: string; body: string }> = [];
  const tooltips: string[] = [];
  const autostartCalls: boolean[] = [];
  let ribbits = 0;
  let granted = options.granted ?? true;
  let autostartThrows = options.autostartThrows ?? false;
  let autostartEnabled = options.autostartEnabled ?? false;

  const tickCbs = new Set<() => void>();
  const wakeCbs = new Set<() => void>();
  const trayLogCbs = new Set<(ml: number) => void>();
  const trayPauseCbs = new Set<(minutes: number) => void>();

  const platform: Platform = {
    kind: "browser",
    persistence: createMemoryPersistence(options.initial),
    notifier: {
      async ensurePermission() {
        return granted;
      },
      async send(title, body) {
        if (!granted) return false;
        sent.push({ title, body });
        return true;
      },
    },
    sound: {
      ribbit() {
        ribbits += 1;
      },
    },
    autostart: {
      supported: options.autostartSupported ?? true,
      async isEnabled() {
        return autostartEnabled;
      },
      async setEnabled(on) {
        autostartCalls.push(on);
        if (autostartThrows) throw new Error("autostart failed");
        autostartEnabled = on;
      },
    },
    tray: {
      async setTooltip(text) {
        tooltips.push(text);
      },
    },
    events: {
      async onTick(cb) {
        tickCbs.add(cb);
        return () => tickCbs.delete(cb);
      },
      async onWake(cb) {
        wakeCbs.add(cb);
        return () => wakeCbs.delete(cb);
      },
      async onTrayLog(cb) {
        trayLogCbs.add(cb);
        return () => trayLogCbs.delete(cb);
      },
      async onTrayPause(cb) {
        trayPauseCbs.add(cb);
        return () => trayPauseCbs.delete(cb);
      },
    },
  };

  return {
    platform,
    sent,
    tooltips,
    autostartCalls,
    ribbitCount: () => ribbits,
    activeListeners: () => tickCbs.size + wakeCbs.size + trayLogCbs.size + trayPauseCbs.size,
    setGranted: (value) => {
      granted = value;
    },
    setAutostartThrows: (value) => {
      autostartThrows = value;
    },
    emitTick: () => {
      for (const cb of [...tickCbs]) cb();
    },
    emitWake: () => {
      for (const cb of [...wakeCbs]) cb();
    },
    emitTrayLog: (ml) => {
      for (const cb of [...trayLogCbs]) cb(ml);
    },
    emitTrayPause: (minutes) => {
      for (const cb of [...trayPauseCbs]) cb(minutes);
    },
  };
}
