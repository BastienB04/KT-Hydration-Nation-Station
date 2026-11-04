import { describe, expect, it } from "vitest";
import { createDefaultData } from "../core/schema";
import { createAppStore } from "./store";
import type { RootState } from "./reducer";

function initial(): RootState {
  const data = createDefaultData();
  data.settings.setupDone = true;
  return { data, ui: { saveError: null, notificationsBlocked: false } };
}

const now = new Date(2026, 10, 4, 10).getTime();

describe("createAppStore", () => {
  it("notifies subscribers on a real change and supports unsubscribe", () => {
    const store = createAppStore(initial());
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.dispatch({ type: "logDrink", ml: 250, now });
    expect(calls).toBe(1);
    unsubscribe();
    store.dispatch({ type: "logDrink", ml: 250, now });
    expect(calls).toBe(1);
  });

  it("does not notify on a no-op action", () => {
    const store = createAppStore(initial());
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });
    store.dispatch({ type: "logDrink", ml: 0, now });
    expect(calls).toBe(0);
  });

  it("delivers the final state to a nested dispatch", () => {
    const store = createAppStore(initial());
    const seen: number[] = [];
    store.subscribe(() => {
      const total = store.getState().data.log["2026-11-04"]?.length ?? 0;
      seen.push(total);
      if (total === 1) store.dispatch({ type: "logDrink", ml: 150, now });
    });
    store.dispatch({ type: "logDrink", ml: 250, now });
    expect(store.getState().data.log["2026-11-04"]).toHaveLength(2);
    expect(seen).toContain(2);
  });
});
