import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DownloadEvent } from "@tauri-apps/plugin-updater";
import type { DownloadProgress } from "./types";

const native = vi.hoisted(() => ({
  invoke: vi.fn(),
  download: vi.fn(),
  install: vi.fn(),
  close: vi.fn(),
  relaunch: vi.fn(),
  constructed: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: native.invoke }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: native.relaunch }));
vi.mock("@tauri-apps/plugin-updater", () => ({
  Update: class {
    version: string;
    constructor(metadata: { version: string }) {
      native.constructed(metadata);
      this.version = metadata.version;
    }
    download = native.download;
    install = native.install;
    close = native.close;
  },
}));

import { createTauriUpdater } from "./tauriUpdater";

beforeEach(() => {
  for (const mock of Object.values(native)) mock.mockReset();
  native.download.mockResolvedValue(undefined);
  native.install.mockResolvedValue(undefined);
  native.close.mockResolvedValue(undefined);
  native.relaunch.mockResolvedValue(undefined);
});

const metadata = { rid: 17, version: "0.1.1", currentVersion: "0.1.0", rawJson: {} };

describe("Tauri updater adapter", () => {
  it("uses the guarded native check and never calls the stock check command", async () => {
    native.invoke.mockResolvedValueOnce(true).mockResolvedValueOnce(metadata);
    const updater = await createTauriUpdater();
    const update = await updater.check();
    expect(native.invoke.mock.calls.map(call => call[0])).toEqual(["updater_supported", "check_for_update"]);
    expect(native.constructed).toHaveBeenCalledWith(metadata);
    expect(update?.version).toBe("0.1.1");
  });

  it("does not check or allocate an update on unsupported or unconfigured builds", async () => {
    native.invoke.mockResolvedValueOnce(false);
    const updater = await createTauriUpdater();
    expect(updater.supported).toBe(false);
    expect(await updater.check()).toBeNull();
    expect(native.invoke).toHaveBeenCalledTimes(1);
    expect(native.constructed).not.toHaveBeenCalled();
  });

  it("handles the no-update response without allocating resources", async () => {
    native.invoke.mockResolvedValueOnce(true).mockResolvedValueOnce(null);
    const updater = await createTauriUpdater();
    expect(await updater.check()).toBeNull();
    expect(native.constructed).not.toHaveBeenCalled();
  });

  it("reports byte progress with a finite timeout and awaits native verification", async () => {
    let complete!: () => void;
    native.download.mockReturnValueOnce(new Promise<void>(resolve => { complete = resolve; }));
    native.invoke.mockResolvedValueOnce(true).mockResolvedValueOnce(metadata);
    const updater = await createTauriUpdater();
    const update = await updater.check();
    const progress: DownloadProgress[] = [];
    let resolved = false;
    const transfer = update!.download(p => progress.push(p)).then(() => { resolved = true; });
    const callback = native.download.mock.calls[0][0] as (event: DownloadEvent) => void;
    callback({ event: "Started", data: { contentLength: 100 } });
    callback({ event: "Progress", data: { chunkLength: 40 } });
    callback({ event: "Progress", data: { chunkLength: 60 } });
    callback({ event: "Finished" });
    await Promise.resolve();
    expect(progress[progress.length - 1]).toEqual({ downloadedBytes: 100, totalBytes: 100, finished: true });
    expect(resolved).toBe(false);
    expect(native.download.mock.calls[0][1]).toEqual({ timeout: 300_000 });
    complete();
    await transfer;
    expect(resolved).toBe(true);
  });

  it("installs with Windows restart enabled and exposes resource cleanup and relaunch", async () => {
    native.invoke.mockResolvedValueOnce(true).mockResolvedValueOnce(metadata);
    const updater = await createTauriUpdater();
    const update = await updater.check();
    await update!.install();
    await update!.close();
    await updater.relaunch();
    expect(native.install).toHaveBeenCalledWith({ restartAfterInstall: true });
    expect(native.close).toHaveBeenCalledTimes(1);
    expect(native.relaunch).toHaveBeenCalledTimes(1);
  });
});
