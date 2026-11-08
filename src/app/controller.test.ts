import { describe, expect, it } from "vitest";
import { createDefaultData, type PersistedData, type Settings } from "../core/schema";
import { createAppStore } from "../state/store";
import type { RootState } from "../state/reducer";
import { createFakePlatform } from "../test/fakePlatform";
import { createController } from "./controller";

// Instants on 2026-11-04 (Wed, GMT so local == UTC), inside 08:00-22:00.
function at(h: number, m = 0): number {
  return new Date(2026, 10, 4, h, m).getTime();
}
function iso(h: number, m = 0): string {
  return new Date(2026, 10, 4, h, m).toISOString();
}

function buildStore(mutate?: (d: PersistedData) => void) {
  const data = createDefaultData();
  data.settings.setupDone = true;
  mutate?.(data);
  const root: RootState = { data, ui: { saveError: null, notificationsBlocked: false } };
  return createAppStore(root);
}

/** Let pending async work (evaluate -> notifier.send, save queue) settle. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 5));
}

describe("controller reminders", () => {
  it("does not fire before setup is done", async () => {
    const h = createFakePlatform();
    const store = buildStore((d) => {
      d.settings.setupDone = false;
    });
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    h.emitTick();
    await settle();
    expect(h.sent).toHaveLength(0);
    c.dispose();
  });

  it("fires exactly one notification at the due time, with sound on", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    let clock = at(8, 30); // not due yet
    const c = createController({ store, platform: h.platform, now: () => clock, applyAutostartOnSetup: false });
    await c.start();
    expect(h.sent).toHaveLength(0);

    clock = at(9); // now due (anchor = 08:00 start, interval 60)
    h.emitTick();
    await settle();

    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].title).toBe("Ribbit says: time for a sip 🐸");
    expect(h.sent[0].body.length).toBeGreaterThan(0);
    expect(h.ribbitCount()).toBe(1);
    c.dispose();
  });

  it("plays no ribbit when sound is off", async () => {
    const h = createFakePlatform();
    const store = buildStore((d) => {
      d.settings.soundEnabled = false;
    });
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    await settle();
    expect(h.sent).toHaveLength(1);
    expect(h.ribbitCount()).toBe(0);
    c.dispose();
  });

  it("fires once for a tick and a wake in the same turn", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    let clock = at(8, 30);
    const c = createController({ store, platform: h.platform, now: () => clock, applyAutostartOnSetup: false });
    await c.start();
    clock = at(9);
    h.emitTick();
    h.emitWake();
    await settle();
    expect(h.sent).toHaveLength(1);
    c.dispose();
  });

  it("fires once after sleeping through several intervals", async () => {
    const h = createFakePlatform();
    const store = buildStore((d) => {
      d.state.lastReminderAt = iso(9);
    });
    const c = createController({ store, platform: h.platform, now: () => at(12, 10), applyAutostartOnSetup: false });
    await c.start(); // one catch-up fire
    expect(h.sent).toHaveLength(1);
    h.emitTick();
    await settle();
    expect(h.sent).toHaveLength(1);
    c.dispose();
  });
});

describe("controller tray actions", () => {
  it("logs 250 ml from the tray and refreshes the tooltip", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(9, 0), applyAutostartOnSetup: false });
    await c.start();
    h.emitTrayLog(250);
    await settle();
    expect(store.getState().data.log["2026-11-04"]?.map((e) => e.ml)).toEqual([250]);
    expect(h.tooltips.some((t) => t.includes("250 / 2,000 ml"))).toBe(true);
    c.dispose();
  });

  it("pauses for 60 min from the tray and shows it in the tooltip", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    h.emitTrayPause(60);
    await settle();
    expect(store.getState().data.state.pausedUntil).toBe(iso(10));
    expect(h.tooltips.some((t) => t.includes("paused until 10:00"))).toBe(true);
    c.dispose();
  });
});

describe("controller tray due icon", () => {
  it("sends false once at start and does not resend on unchanged ticks", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    let clock = at(8, 30);
    const c = createController({ store, platform: h.platform, now: () => clock, applyAutostartOnSetup: false });
    await c.start();
    expect(h.attention).toEqual([false]);
    clock = at(8, 40);
    h.emitTick();
    h.emitWake();
    await settle();
    expect(h.attention).toEqual([false]);
    c.dispose();
  });

  it("turns on when a reminder fires, stays on while waiting, and clears on a drink", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    let clock = at(8, 30);
    const c = createController({ store, platform: h.platform, now: () => clock, applyAutostartOnSetup: false });
    await c.start();
    clock = at(9);
    h.emitTick();
    await settle();
    expect(h.sent).toHaveLength(1);
    expect(h.attention).toEqual([false, true]);

    clock = at(9, 10);
    h.emitTick();
    await settle();
    expect(h.attention).toEqual([false, true]);

    c.logDrink(250);
    await settle();
    expect(h.attention).toEqual([false, true, false]);
    c.dispose();
  });

  it("clears when reminders are paused", async () => {
    // OS autostart matches settings, so start() makes no settings dispatch first.
    const h = createFakePlatform({ autostartEnabled: true });
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start(); // due at 09:00, so a reminder fires during start
    await settle();
    expect(h.attention).toEqual([true]);
    c.pauseFor(60);
    await settle();
    expect(h.attention).toEqual([true, false]);
    c.dispose();
  });
  it("retries a failed due-icon update on the next tick, then dedupes", async () => {
    const h = createFakePlatform({ autostartEnabled: true });
    const store = buildStore();
    let fail = true;
    const setAttention = h.platform.tray.setAttention.bind(h.platform.tray);
    h.platform.tray.setAttention = async (due) => {
      await setAttention(due);
      if (fail) throw new Error("tray unavailable");
    };
    let clock = at(8, 30);
    const c = createController({ store, platform: h.platform, now: () => clock, applyAutostartOnSetup: false });
    await c.start();
    await settle();
    expect(h.attention).toEqual([false]);
    fail = false;
    clock = at(8, 40);
    h.emitTick();
    await settle();
    expect(h.attention).toEqual([false, false]);
    clock = at(8, 50);
    h.emitTick();
    await settle();
    expect(h.attention).toEqual([false, false]);
    c.dispose();
  });
  it("a stale failure cannot undo a newer due-icon state", async () => {
    const h = createFakePlatform({ autostartEnabled: true });
    const store = buildStore();
    const calls: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];
    h.platform.tray.setAttention = (due) => {
      h.attention.push(due);
      return new Promise<void>((resolve, reject) => calls.push({ resolve, reject }));
    };
    let clock = at(8, 30);
    const c = createController({ store, platform: h.platform, now: () => clock, applyAutostartOnSetup: false });
    await c.start();
    expect(h.attention).toEqual([false]); // call 0, still pending
    clock = at(9);
    h.emitTick();
    await settle();
    expect(h.sent).toHaveLength(1);
    expect(h.attention).toEqual([false, true]); // call 1, still pending
    calls[0].reject(new Error("stale failure"));
    await settle();
    calls[1].resolve();
    await settle();
    clock = at(9, 10);
    h.emitTick();
    await settle();
    expect(h.attention).toEqual([false, true]); // newer true is still cached
    c.logDrink(250);
    await settle();
    expect(h.attention).toEqual([false, true, false]);
    calls[2].reject(new Error("latest failure"));
    await settle();
    clock = at(9, 11);
    h.emitTick();
    await settle();
    expect(h.attention).toEqual([false, true, false, false]); // latest failure retried
    c.dispose();
  });
});

describe("controller notification clicks", () => {
  it("listens for clicks before the first reminder can be sent", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    let listening = -1;
    const send = h.platform.notifier.send.bind(h.platform.notifier);
    h.platform.notifier.send = async (title, body) => {
      listening = h.activeListeners();
      return send(title, body);
    };
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start(); // due at boot: fires once
    expect(h.sent).toHaveLength(1);
    expect(listening).toBe(5);
    c.dispose();
  });

  it("relays each click to every subscriber until it unsubscribes", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(8, 30), applyAutostartOnSetup: false });
    await c.start();
    let a = 0;
    let b = 0;
    const offA = c.onNotificationOpen(() => (a += 1));
    c.onNotificationOpen(() => (b += 1));
    h.emitNotificationOpen();
    expect([a, b]).toEqual([1, 1]);
    offA();
    h.emitNotificationOpen();
    expect([a, b]).toEqual([1, 2]);
    c.dispose();
  });

  it("does nothing after dispose", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(8, 30), applyAutostartOnSetup: false });
    await c.start();
    let opened = 0;
    const off = c.onNotificationOpen(() => (opened += 1));
    c.dispose();
    h.emitNotificationOpen();
    expect(opened).toBe(0);
    expect(h.activeListeners()).toBe(0);
    off(); // a late unsubscribe after dispose is harmless
  });
});

describe("controller celebration and settings", () => {
  it("celebrates once per day and sends no reminder when the goal is met", async () => {
    // autostartEnabled true so boot reconciliation makes no data change here.
    const h = createFakePlatform({ autostartEnabled: true });
    const store = buildStore((d) => {
      d.settings.dailyGoalMl = 500;
      d.log["2026-11-04"] = [{ t: iso(8), ml: 500 }]; // goal already met
    });
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    expect(h.sent).toHaveLength(0); // goal met: no reminder
    expect(h.ribbitCount()).toBe(0);
    c.logDrink(250); // a data change while met triggers the one celebration
    await settle();
    expect(h.ribbitCount()).toBe(1);
    expect(store.getState().data.state.lastCelebratedDate).toBe("2026-11-04");
    c.logDrink(250); // still over goal, no second celebration
    await settle();
    expect(h.ribbitCount()).toBe(1);
    expect(h.sent).toHaveLength(0);
    c.dispose();
  });

  it("re-evaluates when settings change", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(8, 30), applyAutostartOnSetup: false });
    await c.start();
    expect(h.sent).toHaveLength(0);
    await c.saveSettings({ ...store.getState().data.settings, reminderEveryMin: 1 });
    await settle();
    expect(h.sent).toHaveLength(1);
    c.dispose();
  });

  it("reverts launchAtLogin when the OS autostart call throws", async () => {
    // autostartEnabled true so boot reconciliation leaves launchAtLogin on.
    const h = createFakePlatform({ autostartThrows: true, autostartEnabled: true });
    const store = buildStore(); // launchAtLogin defaults to true
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    const result = await c.saveSettings({ ...store.getState().data.settings, launchAtLogin: false });
    expect(result.ok).toBe(false);
    expect(h.autostartCalls).toEqual([false]);
    expect(store.getState().data.settings.launchAtLogin).toBe(true);
    c.dispose();
  });
});

describe("controller theme", () => {
  it("setTheme changes the theme live and persists it through the save queue", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(8, 30), applyAutostartOnSetup: false });
    await c.start();
    c.setTheme("dark");
    expect(store.getState().data.settings.theme).toBe("dark");
    await settle();
    const saved = (await h.platform.persistence.load()) as PersistedData;
    expect(saved.settings.theme).toBe("dark");
    c.dispose();
  });
  it("saveSettings keeps the stored theme even when given a stale one", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(8, 30), applyAutostartOnSetup: false });
    await c.start();
    const stale: Settings = { ...store.getState().data.settings, theme: "light" };
    c.setTheme("dark");
    await c.saveSettings({ ...stale, dailyGoalMl: 2500 });
    expect(store.getState().data.settings.dailyGoalMl).toBe(2500);
    expect(store.getState().data.settings.theme).toBe("dark");
    c.dispose();
  });
});
describe("controller setup and boot", () => {
  it("does not touch the OS autostart when applyAutostartOnSetup is false", async () => {
    const h = createFakePlatform();
    const store = buildStore((d) => {
      d.settings.setupDone = false;
    });
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    await c.completeSetup({ dailyGoalMl: 2000, activeHours: { start: "08:00", end: "22:00" }, frogName: "Ribbit" });
    await settle();
    expect(h.autostartCalls).toHaveLength(0);
    expect(store.getState().ui.notificationsBlocked).toBe(false);
    c.dispose();
  });

  it("reads the OS autostart at boot and copies it into settings without writing", async () => {
    const h = createFakePlatform({ autostartSupported: true, autostartEnabled: false });
    const store = buildStore(); // launchAtLogin defaults to true
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    await settle();
    expect(h.autostartCalls).toHaveLength(0);
    expect(store.getState().data.settings.launchAtLogin).toBe(false);
    c.dispose();
  });
});

describe("controller lifecycle", () => {
  it("removes all listeners on dispose", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    expect(h.activeListeners()).toBe(5);
    c.dispose();
    expect(h.activeListeners()).toBe(0);
  });

  it("leaks nothing when disposed during pending subscriptions", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    const startPromise = c.start();
    c.dispose();
    await startPromise;
    await settle();
    expect(h.activeListeners()).toBe(0);
  });

  it("persists every data change so the reloaded store equals state", async () => {
    const h = createFakePlatform();
    const store = buildStore();
    const c = createController({ store, platform: h.platform, now: () => at(9), applyAutostartOnSetup: false });
    await c.start();
    c.logDrink(250);
    c.logDrink(150);
    await settle();
    const reloaded = await h.platform.persistence.load();
    expect(reloaded).toEqual(store.getState().data);
    c.dispose();
  });
});
