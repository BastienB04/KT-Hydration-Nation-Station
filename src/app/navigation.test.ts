import { describe, expect, it } from "vitest";
import { createDefaultData } from "../core/schema";
import { createAppStore } from "../state/store";
import { createFakePlatform } from "../test/fakePlatform";
import { createController } from "./controller";
import { POND_SCREEN, openPondOnNotification, type Screen } from "./navigation";

// 08:30 on a weekday inside active hours, before the first reminder is due.
const NOW = new Date(2026, 10, 4, 8, 30).getTime();

async function startedController() {
  const h = createFakePlatform();
  const data = createDefaultData();
  data.settings.setupDone = true;
  const store = createAppStore({ data, ui: { saveError: null, notificationsBlocked: false } });
  const controller = createController({ store, platform: h.platform, now: () => NOW, applyAutostartOnSetup: false });
  await controller.start();
  return { h, controller };
}

describe("notification click navigation", () => {
  it("switches from another screen to Pond", async () => {
    const { h, controller } = await startedController();
    let screen: Screen = "settings";
    openPondOnNotification(controller, (next) => (screen = next));
    h.emitNotificationOpen();
    expect(screen).toBe(POND_SCREEN);
    expect(POND_SCREEN).toBe("home");
    controller.dispose();
  });

  it("is harmless when Pond is already open", async () => {
    const { h, controller } = await startedController();
    const selected: Screen[] = [];
    openPondOnNotification(controller, (next) => selected.push(next));
    h.emitNotificationOpen();
    h.emitNotificationOpen();
    expect(selected).toEqual([POND_SCREEN, POND_SCREEN]);
    controller.dispose();
  });

  it("stops navigating once unsubscribed, as on unmount or StrictMode re-run", async () => {
    const { h, controller } = await startedController();
    let screen: Screen = "history";
    const off = openPondOnNotification(controller, (next) => (screen = next));
    off();
    h.emitNotificationOpen();
    expect(screen).toBe("history");

    // A re-subscribed effect works again and only the live subscription fires.
    const selected: Screen[] = [];
    const offAgain = openPondOnNotification(controller, (next) => selected.push(next));
    h.emitNotificationOpen();
    expect(selected).toEqual([POND_SCREEN]);
    offAgain();
    controller.dispose();
    expect(h.activeListeners()).toBe(0);
  });
});
