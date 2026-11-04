/**
 * Bridge between the UI and the Tauri shell.
 *
 * Everything that touches Tauri goes through here so the same UI also runs in a
 * plain browser (`npm run dev` + Chrome) for quick visual checks. In the browser
 * the Rust ticker is replaced by a setInterval and tray calls are no-ops.
 */
import { invoke, isTauri } from "@tauri-apps/api/core";

export type RuntimeKind = "tauri" | "browser";

export interface RuntimeHandlers {
  /** Fired every ~30 s by the Rust ticker (or a browser interval). */
  onTick: () => void;
}

export interface Runtime {
  kind: RuntimeKind;
  /** Replace the tray tooltip, e.g. "Ribbit · 1,250 / 2,000 ml". */
  setTrayTooltip(text: string): Promise<void>;
  dispose(): void;
}

const BROWSER_TICK_MS = 30_000;

export async function startRuntime(handlers: RuntimeHandlers): Promise<Runtime> {
  if (!isTauri()) {
    const id = window.setInterval(handlers.onTick, BROWSER_TICK_MS);
    return {
      kind: "browser",
      setTrayTooltip: async () => {},
      dispose: () => window.clearInterval(id),
    };
  }

  const [{ listen }, { getCurrentWindow }] = await Promise.all([
    import("@tauri-apps/api/event"),
    import("@tauri-apps/api/window"),
  ]);

  const win = getCurrentWindow();
  const unlistenTick = await listen("tick", handlers.onTick);

  // Closing the window hides it to the tray; the app keeps running (F-10).
  const unlistenClose = await win.onCloseRequested(async (event) => {
    event.preventDefault();
    await win.hide();
  });

  return {
    kind: "tauri",
    setTrayTooltip: (text) => invoke("set_tray_tooltip", { text }),
    dispose: () => {
      unlistenTick();
      unlistenClose();
    },
  };
}
