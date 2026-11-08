import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultData, type PersistedData } from "../core/schema";
import { createAppStore } from "../state/store";
import { createFakePlatform } from "../test/fakePlatform";
import { createController } from "./controller";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function build() {
  const data = createDefaultData();
  data.settings.setupDone = true;
  data.settings.launchAtLogin = false;
  const store = createAppStore({ data, ui: { saveError: null, notificationsBlocked: false } });
  const h = createFakePlatform();
  const controller = createController({
    store, platform: h.platform,
    now: () => new Date(2026, 10, 4, 8, 30).getTime(),
    applyAutostartOnSetup: false,
  });
  return { store, h, controller };
}

afterEach(() => vi.useRealTimers());

describe("save before update", () => {
  it("waits for the latest queued write and freezes UI and tray mutations", async () => {
    const b = build();
    const slow = deferred<void>();
    const writes: PersistedData[] = [];
    b.h.platform.persistence.save = vi.fn(async data => {
      if (writes.length === 0) await slow.promise;
      writes.push(structuredClone(data));
    });
    await b.controller.start();
    b.controller.logDrink(250);
    b.controller.logDrink(400);
    const prepared = b.controller.prepareUpdate();
    const frozen = b.store.getState().data;
    b.h.emitTrayLog(250);
    b.h.emitTrayPause(60);
    b.controller.setTheme("dark");
    b.controller.undoLast();
    expect(b.store.getState().data).toBe(frozen);
    slow.resolve();
    const release = await prepared;
    expect(writes[writes.length - 1]).toEqual(frozen);
    expect(writes[writes.length - 1]?.log["2026-11-04"].map(entry => entry.ml)).toEqual([250, 400]);
    release();
    expect(b.controller.logDrink(250)).toBe(true);
    b.controller.dispose();
  });

  it("waits for in-flight autostart reconciliation before the final save", async () => {
    const b = build();
    const registration = deferred<void>();
    b.h.platform.autostart.setEnabled = () => registration.promise;
    const writes: PersistedData[] = [];
    b.h.platform.persistence.save = async data => { writes.push(structuredClone(data)); };
    await b.controller.start();
    const setting = b.controller.saveSettings({ ...b.store.getState().data.settings, launchAtLogin: true });
    const prepared = b.controller.prepareUpdate();
    registration.reject(new Error("registration failed"));
    expect((await setting).ok).toBe(false);
    const release = await prepared;
    expect(writes[writes.length - 1]?.settings.launchAtLogin).toBe(false);
    release();
    b.controller.dispose();
  });

  it("blocks an update on write failure, then unfreezes and permits recovery", async () => {
    const b = build();
    b.h.platform.persistence.save = vi.fn(async () => { throw new Error("disk full"); });
    await b.controller.start();
    b.controller.logDrink(250);
    await expect(b.controller.prepareUpdate()).rejects.toThrow("could not be saved");
    expect(b.controller.logDrink(100)).toBe(true);
    b.h.platform.persistence.save = vi.fn(async () => {});
    const release = await b.controller.prepareUpdate();
    expect(b.store.getState().ui.saveError).toBeNull();
    release();
    b.controller.dispose();
  });

  it("times out a stuck save without launching an update or permanently freezing the app", async () => {
    vi.useFakeTimers();
    const b = build();
    const slow = deferred<void>();
    b.h.platform.persistence.save = () => slow.promise;
    await b.controller.start();
    const prepared = b.controller.prepareUpdate();
    const rejected = expect(prepared).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(15_000);
    await rejected;
    expect(b.controller.logDrink(250)).toBe(true);
    slow.resolve();
    b.controller.dispose();
  });
});
