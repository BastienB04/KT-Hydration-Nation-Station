import { describe, expect, it, vi } from "vitest";
import { createDefaultData } from "../core/schema";
import type { DownloadProgress, UpdateDownload } from "../platform/types";
import { createAppStore } from "../state/store";
import { createFakePlatform } from "../test/fakePlatform";
import { createUpdateManager, UPDATE_INTERVAL_MS } from "./updates";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function settle() {
  for (let i = 0; i < 12; i += 1) await Promise.resolve();
}

function update(version = "0.1.1"): UpdateDownload & {
  download: ReturnType<typeof vi.fn<UpdateDownload["download"]>>;
  install: ReturnType<typeof vi.fn<UpdateDownload["install"]>>;
  close: ReturnType<typeof vi.fn<UpdateDownload["close"]>>;
} {
  return {
    version,
    download: vi.fn(async () => {}),
    install: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  };
}

function build(enabled = true, supported = true) {
  const data = createDefaultData();
  data.settings.checkUpdates = enabled;
  const store = createAppStore({ data, ui: { saveError: null, notificationsBlocked: false } });
  const h = createFakePlatform();
  const check = vi.fn(async (): Promise<UpdateDownload | null> => null);
  const relaunch = vi.fn(async () => {});
  h.platform.updater = { supported, check, relaunch };
  const release = vi.fn();
  const prepareInstall = vi.fn<() => Promise<() => void>>(async () => release);
  let clock = 1_000_000;
  const manager = createUpdateManager({ store, platform: h.platform, prepareInstall, now: () => clock });
  return {
    store, h, check, relaunch, release, prepareInstall, manager,
    advance(ms: number) { clock += ms; },
    preference(on: boolean) {
      store.dispatch({ type: "updateSettings", settings: { ...store.getState().data.settings, checkUpdates: on } });
    },
  };
}

describe("update checks", () => {
  it("does not contact GitHub or register update listeners in browser/Mac previews", async () => {
    const b = build(true, false);
    await b.manager.start();
    await b.manager.check();
    expect(b.check).not.toHaveBeenCalled();
    expect(b.h.activeListeners()).toBe(0);
    expect(b.manager.getState().phase).toBe("unsupported");
    b.manager.dispose();
  });

  it("checks once at launch and every six hours, including one catch-up after sleep", async () => {
    const b = build();
    await b.manager.start();
    expect(b.check).toHaveBeenCalledTimes(1);
    b.advance(UPDATE_INTERVAL_MS - 1);
    b.h.emitTick();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(1);
    b.advance(1);
    b.h.emitTick();
    b.h.emitWake();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(2);
    b.advance(4 * UPDATE_INTERVAL_MS);
    b.h.emitWake();
    b.h.emitTick();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(3);
    b.manager.dispose();
    expect(b.h.activeListeners()).toBe(0);
  });

  it("respects the preference while retaining an explicit manual check", async () => {
    const b = build(false);
    await b.manager.start();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitTick();
    await settle();
    expect(b.check).not.toHaveBeenCalled();
    await b.manager.check();
    expect(b.check).toHaveBeenCalledTimes(1);
    b.preference(true);
    await settle();
    expect(b.check).toHaveBeenCalledTimes(2);
    b.preference(false);
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitWake();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(2);
    b.manager.dispose();
  });

  it("discards an automatic result if checks were disabled during the request", async () => {
    const b = build();
    const pending = deferred<UpdateDownload | null>();
    const u = update();
    b.check.mockReturnValueOnce(pending.promise);
    const started = b.manager.start();
    await settle();
    b.preference(false);
    pending.resolve(u);
    await started;
    expect(u.close).toHaveBeenCalledTimes(1);
    expect(b.manager.getState().phase).toBe("idle");
    b.manager.dispose();
  });

  it("prevents concurrent checks and bounds automatic retries after network errors", async () => {
    const b = build();
    const pending = deferred<UpdateDownload | null>();
    b.check.mockReturnValueOnce(pending.promise);
    const started = b.manager.start();
    await settle();
    await b.manager.check();
    b.h.emitWake();
    expect(b.check).toHaveBeenCalledTimes(1);
    pending.reject(new Error("opaque internal error"));
    await started;
    expect(b.manager.getState().error).not.toContain("opaque");
    expect(b.manager.getState().notice).toBe(false);
    b.h.emitTick();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(1);
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitTick();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(2);
    expect(b.manager.getState().error).toBeNull();
    b.manager.dispose();
  });

  it("handles a wall-clock correction without a burst of requests", async () => {
    const b = build();
    await b.manager.start();
    b.advance(-60_000);
    b.h.emitTick();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(1);
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitWake();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(2);
    b.manager.dispose();
  });

  it("closes an obsolete candidate after an explicit fresh check", async () => {
    const b = build();
    const first = update();
    const second = update("0.1.2");
    b.check.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    await b.manager.start();
    expect(b.check).toHaveBeenCalledTimes(1);
    await b.manager.check();
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(b.manager.getState().version).toBe("0.1.2");
    b.manager.dispose();
    await settle();
    expect(second.close).toHaveBeenCalledTimes(1);
  });

  it("refreshes a deferred release without repeating its notice, then offers a newer release", async () => {
    const b = build();
    const first = update();
    const unchanged = update();
    const newer = update("0.1.2");
    b.check.mockResolvedValueOnce(first).mockResolvedValueOnce(unchanged).mockResolvedValueOnce(newer);
    await b.manager.start();
    b.manager.later();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitTick();
    await settle();
    expect(b.check).toHaveBeenCalledTimes(2);
    expect(b.manager.getState().notice).toBe(false);
    expect(first.close).toHaveBeenCalledTimes(1);
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitWake();
    await settle();
    expect(b.manager.getState()).toMatchObject({ phase: "available", version: "0.1.2", notice: true });
    expect(unchanged.close).toHaveBeenCalledTimes(1);
    b.manager.dispose();
  });

  it("retains a candidate during a failed refresh or a preference change", async () => {
    const b = build();
    const first = update();
    const replacement = update("0.1.2");
    const pending = deferred<UpdateDownload | null>();
    b.check.mockResolvedValueOnce(first).mockRejectedValueOnce(new Error("offline")).mockReturnValueOnce(pending.promise);
    await b.manager.start();
    b.manager.later();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitTick();
    await settle();
    expect(b.manager.getState()).toMatchObject({ phase: "available", version: "0.1.1", notice: false });
    expect(first.close).not.toHaveBeenCalled();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitTick();
    await settle();
    b.preference(false);
    pending.resolve(replacement);
    await settle();
    expect(b.manager.getState()).toMatchObject({ phase: "available", version: "0.1.1", notice: false });
    expect(replacement.close).toHaveBeenCalledTimes(1);
    await b.manager.download();
    expect(first.download).toHaveBeenCalledTimes(1);
    b.manager.dispose();
  });

  it("closes a result received after disposal and removes late listeners", async () => {
    const b = build();
    const pending = deferred<UpdateDownload | null>();
    const u = update();
    b.check.mockReturnValueOnce(pending.promise);
    const started = b.manager.start();
    await settle();
    b.manager.dispose();
    pending.resolve(u);
    await started;
    expect(u.close).toHaveBeenCalledTimes(1);
    expect(b.h.activeListeners()).toBe(0);

    const late = build();
    const listener = deferred<() => void>();
    const unlisten = vi.fn();
    late.h.platform.events.onTick = () => listener.promise;
    const lateStart = late.manager.start();
    late.manager.dispose();
    listener.resolve(unlisten);
    await lateStart;
    expect(unlisten).toHaveBeenCalledTimes(1);
    expect(late.check).not.toHaveBeenCalled();
  });
});

describe("update download and installation", () => {
  it("waits for signature verification after Finished, then lets Later defer install", async () => {
    const b = build();
    const u = update();
    const verified = deferred<void>();
    let progress!: (p: DownloadProgress) => void;
    u.download.mockImplementation((cb) => { progress = cb; return verified.promise; });
    b.check.mockResolvedValue(u);
    await b.manager.start();
    const download = b.manager.download();
    await b.manager.download();
    progress({ downloadedBytes: 120, totalBytes: 200, finished: false });
    expect(b.manager.getState().phase).toBe("downloading");
    progress({ downloadedBytes: 200, totalBytes: 200, finished: true });
    expect(b.manager.getState().phase).toBe("verifying");
    await b.manager.install();
    expect(u.install).not.toHaveBeenCalled();
    verified.resolve();
    await download;
    expect(b.manager.getState().phase).toBe("ready");
    b.manager.later();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitWake();
    await settle();
    expect(b.manager.getState().notice).toBe(false);
    expect(b.manager.getState().phase).toBe("ready");
    expect(u.download).toHaveBeenCalledTimes(1);
    expect(u.install).not.toHaveBeenCalled();
    b.manager.dispose();
  });

  it("never installs a download that fails verification and permits retry", async () => {
    const b = build();
    const u = update();
    u.download.mockImplementationOnce(async (progress) => {
      progress({ downloadedBytes: 100, totalBytes: null, finished: true });
      throw new Error("invalid signature");
    });
    b.check.mockResolvedValue(u);
    await b.manager.start();
    await b.manager.download();
    expect(b.manager.getState().phase).toBe("available");
    expect(b.manager.getState().error).toContain("verify");
    await b.manager.install();
    expect(u.install).not.toHaveBeenCalled();
    await b.manager.download();
    expect(b.manager.getState().phase).toBe("ready");
    b.manager.dispose();
  });

  it("finds a newer release after a failed signature check", async () => {
    const b = build();
    const bad = update();
    const fixed = update("0.1.2");
    bad.download.mockRejectedValueOnce(new Error("invalid signature"));
    b.check.mockResolvedValueOnce(bad).mockResolvedValueOnce(fixed);
    await b.manager.start();
    await b.manager.download();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitWake();
    await settle();
    expect(b.manager.getState()).toMatchObject({ phase: "available", version: "0.1.2", error: null });
    expect(bad.close).toHaveBeenCalledTimes(1);
    expect(bad.install).not.toHaveBeenCalled();
    await b.manager.download();
    expect(fixed.download).toHaveBeenCalledTimes(1);
    b.manager.dispose();
  });

  it("keeps verified bytes on an unchanged refresh and replaces them when a newer release appears", async () => {
    const b = build();
    const verified = update();
    const unchanged = update();
    const newer = update("0.1.2");
    b.check.mockResolvedValueOnce(verified).mockResolvedValueOnce(unchanged).mockResolvedValueOnce(newer);
    await b.manager.start();
    await b.manager.download();
    b.manager.later();
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitTick();
    await settle();
    expect(b.manager.getState()).toMatchObject({ phase: "ready", version: "0.1.1", notice: false });
    expect(unchanged.close).toHaveBeenCalledTimes(1);
    expect(verified.close).not.toHaveBeenCalled();
    expect(verified.download).toHaveBeenCalledTimes(1);
    b.advance(UPDATE_INTERVAL_MS);
    b.h.emitWake();
    await settle();
    expect(b.manager.getState()).toMatchObject({ phase: "available", version: "0.1.2", notice: true });
    expect(verified.close).toHaveBeenCalledTimes(1);
    expect(newer.download).not.toHaveBeenCalled();
    b.manager.dispose();
  });

  it("Later never starts a transfer and update UI state is not persisted", async () => {
    const b = build();
    const before = JSON.stringify(b.store.getState().data);
    const u = update();
    b.check.mockResolvedValue(u);
    await b.manager.start();
    b.manager.later();
    expect(u.download).not.toHaveBeenCalled();
    expect(JSON.stringify(b.store.getState().data)).toBe(before);
    b.manager.dispose();
  });

  it("flushes data before installing and does not run concurrent installs", async () => {
    const b = build();
    const u = update();
    const saved = deferred<() => void>();
    b.check.mockResolvedValue(u);
    b.prepareInstall.mockReturnValueOnce(saved.promise);
    await b.manager.start();
    await b.manager.download();
    const installing = b.manager.install();
    await b.manager.install();
    expect(u.install).not.toHaveBeenCalled();
    saved.resolve(b.release);
    await installing;
    expect(u.install).toHaveBeenCalledTimes(1);
    expect(b.prepareInstall).toHaveBeenCalledTimes(1);
    expect(b.relaunch).toHaveBeenCalledTimes(1);
    expect(b.release).toHaveBeenCalledTimes(1);
    expect(u.close).toHaveBeenCalledTimes(1);
    b.manager.dispose();
  });

  it("refuses installation on save failure and keeps the verified candidate", async () => {
    const b = build();
    const u = update();
    b.check.mockResolvedValue(u);
    b.prepareInstall.mockRejectedValueOnce(new Error("disk full"));
    await b.manager.start();
    await b.manager.download();
    await b.manager.install();
    expect(u.install).not.toHaveBeenCalled();
    expect(b.manager.getState().phase).toBe("ready");
    expect(b.manager.getState().error).toContain("save");
    await b.manager.install();
    expect(u.install).toHaveBeenCalledTimes(1);
    b.manager.dispose();
  });

  it("restores usability when the installer cannot launch", async () => {
    const b = build();
    const u = update();
    u.install.mockRejectedValueOnce(new Error("ShellExecute failed"));
    b.check.mockResolvedValue(u);
    await b.manager.start();
    await b.manager.download();
    await b.manager.install();
    expect(b.release).toHaveBeenCalledTimes(1);
    expect(b.relaunch).not.toHaveBeenCalled();
    expect(b.manager.getState().phase).toBe("ready");
    expect(b.manager.getState().error).toContain("couldn't start");
    b.manager.dispose();
  });

  it("offers restart recovery without installing the same bytes twice", async () => {
    const b = build();
    const u = update();
    b.relaunch.mockRejectedValueOnce(new Error("restart failed"));
    b.check.mockResolvedValue(u);
    await b.manager.start();
    await b.manager.download();
    await b.manager.install();
    expect(b.manager.getState().phase).toBe("restartRequired");
    await b.manager.install();
    expect(u.install).toHaveBeenCalledTimes(1);
    expect(u.close).toHaveBeenCalledTimes(1);
    expect(b.relaunch).toHaveBeenCalledTimes(2);
    expect(b.prepareInstall).toHaveBeenCalledTimes(2);
    b.manager.dispose();
  });

  it("defers resource cleanup until a pending transfer settles after disposal", async () => {
    const b = build();
    const u = update();
    const transfer = deferred<void>();
    u.download.mockReturnValueOnce(transfer.promise);
    b.check.mockResolvedValue(u);
    await b.manager.start();
    const download = b.manager.download();
    b.manager.dispose();
    expect(u.close).not.toHaveBeenCalled();
    transfer.resolve();
    await download;
    expect(u.close).toHaveBeenCalledTimes(1);
    await b.manager.install();
    expect(u.install).not.toHaveBeenCalled();
  });

  it("does not launch an installer if disposed while saving", async () => {
    const b = build();
    const u = update();
    const saved = deferred<() => void>();
    b.prepareInstall.mockReturnValueOnce(saved.promise);
    b.check.mockResolvedValue(u);
    await b.manager.start();
    await b.manager.download();
    const installing = b.manager.install();
    b.manager.dispose();
    saved.resolve(b.release);
    await installing;
    expect(u.install).not.toHaveBeenCalled();
    expect(b.release).toHaveBeenCalledTimes(1);
    expect(u.close).toHaveBeenCalledTimes(1);
  });
});
