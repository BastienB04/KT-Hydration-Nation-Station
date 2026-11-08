/**
 * Ephemeral update state, separate from hydration data. Timestamp checks also
 * work while hidden and after sleep; downloads and installation need a click.
 */
import type { DownloadProgress, Platform, UpdateDownload } from "../platform/types";
import type { AppStore } from "../state/store";

export const UPDATE_INTERVAL_MS = 6 * 60 * 60_000;

export type UpdatePhase =
  | "unsupported"
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "downloading"
  | "verifying"
  | "ready"
  | "installing"
  | "restarting"
  | "restartRequired";

export interface UpdateState {
  phase: UpdatePhase;
  version: string | null;
  progress: DownloadProgress | null;
  error: string | null;
  notice: boolean;
  lastChecked: number | null;
}

export interface UpdateManager {
  getState(): UpdateState;
  subscribe(cb: () => void): () => void;
  start(): Promise<void>;
  dispose(): void;
  check(): Promise<void>;
  download(): Promise<void>;
  install(): Promise<void>;
  later(): void;
}

interface UpdateOptions {
  store: AppStore;
  platform: Platform;
  /** Freeze mutations and flush the store; release the freeze on failure. */
  prepareInstall: () => Promise<() => void>;
  now?: () => number;
}

export function createUpdateManager(options: UpdateOptions): UpdateManager {
  const { store, platform, prepareInstall } = options;
  const now = options.now ?? Date.now;
  let state: UpdateState = {
    phase: platform.updater.supported ? "idle" : "unsupported",
    version: null,
    progress: null,
    error: null,
    notice: false,
    lastChecked: null,
  };
  const subscribers = new Set<() => void>();
  const closed = new WeakSet<UpdateDownload>();
  let candidate: UpdateDownload | null = null;
  let started = false;
  let disposed = false;
  let lastAttempt: number | null = null;
  let storeUnsub: (() => void) | null = null;
  const unlisteners: Array<() => void> = [];

  function publish(patch: Partial<UpdateState>): void {
    if (disposed) return;
    state = { ...state, ...patch };
    for (const cb of [...subscribers]) cb();
  }

  function busy(): boolean {
    return ["checking", "downloading", "verifying", "installing", "restarting"].includes(state.phase);
  }

  async function close(update: UpdateDownload | null): Promise<void> {
    if (update === null || closed.has(update)) return;
    closed.add(update);
    // Cleanup is best-effort; a failed resource close must not break the app.
    await update.close().catch(() => {});
  }

  async function check(manual: boolean): Promise<void> {
    if (disposed || !platform.updater.supported || busy() || state.phase === "restartRequired") return;
    if (!manual && !store.getState().data.settings.checkUpdates) return;

    const previous = candidate;
    const previousState = state;
    lastAttempt = now();
    publish({ phase: "checking", error: null, notice: manual || previousState.notice });

    try {
      const update = await platform.updater.check();
      if (disposed) {
        await close(update);
        return;
      }
      if (!manual && !store.getState().data.settings.checkUpdates) {
        if (update !== previous) await close(update);
        publish(previousState);
        return;
      }
      const unchanged = update !== null && update.version === previous?.version;
      if (unchanged && previousState.phase === "ready") {
        // Keep verified bytes instead of downloading the same release again.
        if (update !== previous) await close(update);
        publish({ ...previousState, error: null, notice: manual || previousState.notice, lastChecked: now() });
        return;
      }
      candidate = update;
      if (previous !== update) await close(previous);
      publish({
        phase: update === null ? "current" : "available",
        version: update?.version ?? null,
        progress: null,
        lastChecked: now(),
        notice: update !== null && (manual || !unchanged || previousState.notice),
      });
    } catch {
      publish({
        phase: previous === null ? "idle" : previousState.phase,
        error: "Couldn't check for updates. Check your connection and try again.",
        notice: manual || previousState.notice,
      });
    }
  }

  function automaticCheck(): void {
    if (disposed || !store.getState().data.settings.checkUpdates) return;
    const at = now();
    if (lastAttempt !== null && at < lastAttempt) {
      lastAttempt = at;
      return;
    }
    if (lastAttempt === null || at - lastAttempt >= UPDATE_INTERVAL_MS) void check(false);
  }

  async function track(listener: Promise<() => void>): Promise<void> {
    const unlisten = await listener;
    if (disposed) unlisten();
    else unlisteners.push(unlisten);
  }

  return {
    getState: () => state,
    subscribe(cb) {
      subscribers.add(cb);
      return () => { subscribers.delete(cb); };
    },
    async start() {
      if (started || disposed) return;
      started = true;
      if (!platform.updater.supported) return;
      let enabled = store.getState().data.settings.checkUpdates;
      storeUnsub = store.subscribe(() => {
        const next = store.getState().data.settings.checkUpdates;
        if (next === enabled) return;
        enabled = next;
        if (enabled) {
          lastAttempt = null;
          automaticCheck();
        }
      });
      const listeners = await Promise.allSettled([
        track(platform.events.onTick(automaticCheck)),
        track(platform.events.onWake(automaticCheck)),
      ]);
      if (listeners.some((result) => result.status === "rejected")) {
        publish({ error: "Automatic update checks couldn't start. You can check here manually." });
      }
      if (!disposed && enabled) await check(false);
    },
    dispose() {
      disposed = true;
      storeUnsub?.();
      for (const unlisten of unlisteners) unlisten();
      unlisteners.length = 0;
      subscribers.clear();
      // A transfer still owns its resource until it settles (with a timeout).
      if (!["downloading", "verifying", "installing"].includes(state.phase)) void close(candidate);
      candidate = null;
    },
    check: () => check(true),
    async download() {
      const update = candidate;
      if (disposed || update === null || state.phase !== "available") return;
      publish({
        phase: "downloading",
        error: null,
        progress: { downloadedBytes: 0, totalBytes: null, finished: false },
        notice: true,
      });
      try {
        await update.download((progress) => {
          publish({ phase: progress.finished ? "verifying" : "downloading", progress });
        });
        // Finished means transfer complete, not signature verified. Only the
        // fulfilled download promise permits installation.
        publish({ phase: "ready", error: null });
      } catch {
        publish({
          phase: "available",
          progress: null,
          error: "Couldn't download or verify the update. Nothing was installed. Try again.",
        });
      } finally {
        if (disposed) await close(update);
      }
    },
    async install() {
      const update = candidate;
      const restartOnly = state.phase === "restartRequired";
      if (disposed || (!restartOnly && (update === null || state.phase !== "ready"))) return;
      publish({ phase: "installing", error: null, notice: true });
      let release: (() => void) | undefined;
      let prepared = false;
      let installed = restartOnly;
      try {
        release = await prepareInstall();
        prepared = true;
        if (disposed) return;
        if (!restartOnly && update !== null) {
          await update.install();
          installed = true;
          candidate = null;
          await close(update);
        }
        if (disposed) return;
        // Windows exits in native install; this is a defensive fallback.
        publish({ phase: "restarting" });
        await platform.updater.relaunch();
      } catch {
        publish({
          phase: installed ? "restartRequired" : "ready",
          error: !prepared
            ? "Couldn't save your latest changes, so the update didn't start. Try Restart now again."
            : installed
              ? "The update is installed. Quit Ribbit from the tray and open it again to finish."
              : "The update couldn't start. Keep using Ribbit and try Restart now again.",
        });
      } finally {
        release?.();
        if (disposed) await close(update);
      }
    },
    later() {
      if (busy()) return;
      publish({ notice: false });
    },
  };
}
