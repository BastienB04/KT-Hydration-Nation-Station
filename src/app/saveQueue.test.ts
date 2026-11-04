import { describe, expect, it, vi } from "vitest";
import { createDefaultData, type PersistedData } from "../core/schema";
import { createSaveQueue } from "./saveQueue";

function dataWithGoal(goal: number): PersistedData {
  const d = createDefaultData();
  d.settings.dailyGoalMl = goal;
  return d;
}

describe("createSaveQueue", () => {
  it("coalesces bursts during a slow save and writes the latest", async () => {
    const writes: number[] = [];
    let release!: () => void;
    const persistence = {
      async load() {
        return undefined;
      },
      save: vi.fn(async (data: PersistedData) => {
        if (writes.length === 0) {
          // First (slow) save: hold until released so schedules pile up.
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        }
        writes.push(data.settings.dailyGoalMl);
      }),
    };

    const queue = createSaveQueue(persistence, () => {});
    queue.schedule(dataWithGoal(1000)); // starts the slow save
    await Promise.resolve();
    queue.schedule(dataWithGoal(2000));
    queue.schedule(dataWithGoal(3000));
    queue.schedule(dataWithGoal(4000)); // only the latest survives
    release();
    await queue.flush();

    expect(writes).toEqual([1000, 4000]);
    expect(persistence.save).toHaveBeenCalledTimes(2);
  });

  it("reports a failure then clears it on the next success", async () => {
    const results: Array<unknown | null> = [];
    let shouldThrow = true;
    const persistence = {
      async load() {
        return undefined;
      },
      async save() {
        if (shouldThrow) throw new Error("disk full");
      },
    };
    const queue = createSaveQueue(persistence, (e) => results.push(e));

    queue.schedule(dataWithGoal(1000));
    await queue.flush();
    shouldThrow = false;
    queue.schedule(dataWithGoal(2000));
    await queue.flush();

    expect(results[0]).toBeInstanceOf(Error);
    expect(results[results.length - 1]).toBeNull();
  });
});
