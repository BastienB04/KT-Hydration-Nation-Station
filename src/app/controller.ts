/**
 * Wires the pure store to a platform: it saves on every data change, refreshes
 * the tray tooltip and due icon, celebrates once a day, and runs the scheduler on ticks,
 * wakes, tray actions and relevant state changes. The scheduler and store stay
 * pure; all side effects live here.
 */
import { reminderUnanswered } from "../core/attention";
import { buildTooltip } from "../core/format";
import type { ActiveHours, Settings, ThemeMode } from "../core/schema";
import { evaluate as schedulerEvaluate, restOfDayUntil } from "../core/scheduler";
import { todayKey, todayTotal } from "../core/stats";
import { tipAt } from "../core/tips";
import type { DateKey } from "../core/time";
import type { Platform } from "../platform/types";
import { createSaveQueue } from "./saveQueue";
import type { AppStore } from "../state/store";

export interface Controller {
  start(): Promise<void>;
  dispose(): void;
  /** Schedule a save of the current state (used when load migrated the data). */
  persist(): void;
  evaluate(): Promise<void>;
  /**
   * Subscribe to reminder-notification clicks (relayed from the platform once
   * `start` has registered its listener). Returns an unsubscribe function.
   */
  onNotificationOpen(cb: () => void): () => void;
  logDrink(ml: number): boolean;
  undoLast(): void;
  editEntry(key: DateKey, index: number, t: string, ml: number): void;
  deleteEntry(key: DateKey, index: number, t: string): void;
  snooze(): void;
  pauseFor(minutes: number): void;
  pauseRestOfDay(): void;
  resume(): void;
  nextTip(): void;
  /** Change the theme immediately (live preview); persisted like any data change. */
  setTheme(mode: ThemeMode): void;
  /** Save the Settings form. The stored theme is kept: only `setTheme` changes it. */
  saveSettings(settings: Omit<Settings, "theme">): Promise<{ ok: true } | { ok: false; error: string }>;
  completeSetup(values: { dailyGoalMl: number; activeHours: ActiveHours; frogName: string }): Promise<void>;
  reset(): void;
}

export interface ControllerOptions {
  store: AppStore;
  platform: Platform;
  now?: () => number;
  /** Apply launch-at-login to the OS when setup completes (PROD only). */
  applyAutostartOnSetup: boolean;
}

export function createController(options: ControllerOptions): Controller {
  const { store, platform, applyAutostartOnSetup } = options;
  const now = options.now ?? Date.now;

  const saveQueue = createSaveQueue(platform.persistence, (error) => {
    store.dispatch({
      type: "setSaveError",
      message: error === null ? null : "Couldn't save your data.",
    });
  });

  let lastRoot = store.getState();
  let lastTooltip: string | null = null;
  let lastAttention: boolean | null = null;
  let attentionRequest = 0;
  let firing = false;
  let disposed = false;
  let storeUnsub: (() => void) | null = null;
  const unlisteners: Array<() => void> = [];
  const notificationOpenCbs = new Set<() => void>();

  function relayNotificationOpen(): void {
    if (disposed) return;
    // Copy so a subscriber that unsubscribes mid-notify does not skip others.
    for (const cb of [...notificationOpenCbs]) cb();
  }

  function computeTooltip(): string {
    const { settings, log } = store.getState().data;
    const decision = schedulerEvaluate(store.getState().data, now());
    return buildTooltip(settings.frogName, todayTotal(log, now()), settings.dailyGoalMl, decision);
  }

  async function refreshTooltip(): Promise<void> {
    const text = computeTooltip();
    if (text === lastTooltip) return;
    lastTooltip = text;
    try {
      await platform.tray.setTooltip(text);
    } catch {
      // Tray tooltip is best-effort.
    }
  }

  async function refreshAttention(): Promise<void> {
    const due = reminderUnanswered(store.getState().data, now());
    if (due === lastAttention) return;
    lastAttention = due;
    const request = ++attentionRequest;
    try {
      await platform.tray.setAttention(due);
    } catch {
      // Tray icon is best-effort. Forget the failed value so the next tick or
      // state change retries it, unless a newer request has replaced it.
      if (request === attentionRequest) lastAttention = null;
    }
  }

  /**
   * Update the tray tooltip and due icon, each only when it changed. The icon
   * update is fire-and-forget so evaluate() holds its `firing` guard no longer
   * than in Phase 3 (a longer hold makes an overlapping tick skip its fire);
   * refreshAttention records the new value synchronously, so dedupe holds.
   * A failed icon update clears that record only while it is still the latest
   * request, so the next tick or state change retries it.
   */
  function refreshTray(): Promise<void> {
    void refreshAttention();
    return refreshTooltip();
  }

  function maybeCelebrate(): void {
    const data = store.getState().data;
    if (!data.settings.setupDone) return;
    const today = todayKey(now());
    if (
      todayTotal(data.log, now()) >= data.settings.dailyGoalMl &&
      data.state.lastCelebratedDate !== today
    ) {
      store.dispatch({ type: "celebrated", key: today });
      if (data.settings.soundEnabled) platform.sound.ribbit();
    }
  }

  function onStoreChange(): void {
    const root = store.getState();
    if (root === lastRoot) return;
    const prev = lastRoot;
    lastRoot = root;
    if (root.data !== prev.data) {
      saveQueue.schedule(root.data);
      void refreshTray();
      maybeCelebrate();
      if (
        root.data.settings !== prev.data.settings ||
        root.data.state.pausedUntil !== prev.data.state.pausedUntil
      ) {
        void evaluate();
      }
    }
  }

  async function evaluate(): Promise<void> {
    if (firing) return;
    firing = true;
    try {
      const decision = schedulerEvaluate(store.getState().data, now());
      if (decision.kind === "due") {
        const fireAt = now();
        store.dispatch({ type: "reminderFired", now: fireAt });
        const data = store.getState().data;
        const title = `${data.settings.frogName} says: time for a sip 🐸`;
        const body = tipAt(data.state.tipIndex);
        const sent = await platform.notifier.send(title, body);
        store.dispatch({ type: "setNotificationsBlocked", blocked: !sent });
        if (data.settings.soundEnabled) platform.sound.ribbit();
      }
      await refreshTray();
    } finally {
      firing = false;
    }
  }

  async function track(promise: Promise<() => void>): Promise<void> {
    const unlisten = await promise;
    if (disposed) unlisten();
    else unlisteners.push(unlisten);
  }

  return {
    async start() {
      storeUnsub = store.subscribe(onStoreChange);
      await Promise.all([
        track(platform.events.onTick(() => void evaluate())),
        track(platform.events.onWake(() => void evaluate())),
        track(platform.events.onTrayLog((ml) => void this.logDrink(ml))),
        track(platform.events.onTrayPause((minutes) => this.pauseFor(minutes))),
        track(platform.events.onNotificationOpen(relayNotificationOpen)),
      ]);

      const { settings } = store.getState().data;
      if (settings.setupDone && platform.autostart.supported) {
        try {
          const enabled = await platform.autostart.isEnabled();
          if (enabled !== settings.launchAtLogin) {
            store.dispatch({ type: "updateSettings", settings: { ...settings, launchAtLogin: enabled } });
          }
        } catch {
          // Reading the OS autostart state is best-effort.
        }
      }

      await evaluate();
    },

    dispose() {
      disposed = true;
      for (const unlisten of unlisteners) unlisten();
      unlisteners.length = 0;
      notificationOpenCbs.clear();
      storeUnsub?.();
      storeUnsub = null;
    },

    persist() {
      saveQueue.schedule(store.getState().data);
    },

    evaluate,

    onNotificationOpen(cb) {
      notificationOpenCbs.add(cb);
      return () => {
        notificationOpenCbs.delete(cb);
      };
    },

    logDrink(ml: number): boolean {
      const before = store.getState();
      store.dispatch({ type: "logDrink", ml, now: now() });
      return store.getState() !== before;
    },

    undoLast() {
      store.dispatch({ type: "undoLast", now: now() });
    },

    editEntry(key, index, t, ml) {
      store.dispatch({ type: "editEntry", key, index, t, ml });
    },

    deleteEntry(key, index, t) {
      store.dispatch({ type: "deleteEntry", key, index, t });
    },

    snooze() {
      store.dispatch({ type: "snooze", now: now() });
    },

    pauseFor(minutes: number) {
      store.dispatch({ type: "pauseUntil", until: now() + minutes * 60_000 });
    },

    pauseRestOfDay() {
      store.dispatch({ type: "pauseUntil", until: restOfDayUntil(store.getState().data.settings, now()) });
    },

    resume() {
      store.dispatch({ type: "resume" });
    },

    nextTip() {
      store.dispatch({ type: "nextTip" });
    },

    setTheme(mode: ThemeMode) {
      store.dispatch({ type: "setTheme", theme: mode });
    },
    async saveSettings(settings: Omit<Settings, "theme">) {
      const prev = store.getState().data.settings;
      store.dispatch({
        type: "updateSettings",
        settings: { ...settings, theme: store.getState().data.settings.theme },
      });
      if (platform.autostart.supported && settings.launchAtLogin !== prev.launchAtLogin) {
        try {
          await platform.autostart.setEnabled(settings.launchAtLogin);
        } catch {
          store.dispatch({
            type: "updateSettings",
            settings: { ...store.getState().data.settings, launchAtLogin: prev.launchAtLogin },
          });
          return { ok: false, error: "Saved, but couldn't change launch at login." };
        }
      }
      return { ok: true };
    },

    async completeSetup(values) {
      store.dispatch({ type: "completeSetup", ...values });
      const granted = await platform.notifier.ensurePermission();
      store.dispatch({ type: "setNotificationsBlocked", blocked: !granted });
      const { settings } = store.getState().data;
      if (applyAutostartOnSetup && platform.autostart.supported && settings.launchAtLogin) {
        try {
          await platform.autostart.setEnabled(true);
        } catch (error) {
          console.warn("autostart enable on setup failed", error);
        }
      }
    },

    reset() {
      store.dispatch({ type: "reset" });
    },
  };
}
