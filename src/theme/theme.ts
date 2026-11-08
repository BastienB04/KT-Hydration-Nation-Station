/**
 * Theme controller: applies the System/Light/Dark preference to the document
 * root. Pure apart from the injected environment (root element, the
 * `prefers-color-scheme: dark` media query and storage), so it is testable
 * without a DOM.
 *
 * It always sets `data-theme` (resolved light|dark), `data-theme-mode`
 * (system|light|dark) and `style.colorScheme`. The OS `change` listener is
 * attached only in system mode. The mode is mirrored to storage so `boot.ts`
 * can apply a Light/Dark override before React renders; the persisted store
 * stays the source of truth.
 */
import { isThemeMode, type ThemeMode } from "../core/schema";

export { isThemeMode };
export type { ThemeMode };

export type ResolvedTheme = "light" | "dark";

export const THEME_MIRROR_KEY = "kt-hns:theme";

export interface ThemeRoot {
  setAttribute(name: string, value: string): void;
  style: { colorScheme: string };
}

export interface ThemeMedia {
  readonly matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ThemeEnv {
  root: ThemeRoot;
  media: ThemeMedia | null;
  storage: ThemeStorage | null;
}

export interface ThemeController {
  /** Apply a mode. Repeating the current mode does nothing. */
  setMode(mode: ThemeMode): void;
  /** The applied mode, or null before the first `setMode`. */
  getMode(): ThemeMode | null;
  /** Detach the OS listener. */
  dispose(): void;
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}

/** The mirrored mode, or "system" when missing, junk or unreadable. */
export function readMirroredMode(storage: ThemeStorage | null): ThemeMode {
  try {
    const value = storage?.getItem(THEME_MIRROR_KEY) ?? null;
    return isThemeMode(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function createThemeController(env: ThemeEnv): ThemeController {
  const { root, media, storage } = env;
  let mode: ThemeMode | null = null;
  let listening = false;

  function apply(): void {
    if (mode === null) return;
    const resolved = resolveTheme(mode, media?.matches ?? false);
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-mode", mode);
    root.style.colorScheme = resolved;
  }

  function onChange(): void {
    if (mode === "system") apply();
  }

  function listen(on: boolean): void {
    if (media === null || on === listening) return;
    if (on) media.addEventListener("change", onChange);
    else media.removeEventListener("change", onChange);
    listening = on;
  }

  return {
    setMode(next) {
      const target: ThemeMode = isThemeMode(next) ? next : "system";
      if (target === mode) return;
      mode = target;
      listen(mode === "system");
      apply();
      try {
        storage?.setItem(THEME_MIRROR_KEY, mode);
      } catch {
        // The mirror only avoids a first-frame flash; failing to write is fine.
      }
    },
    getMode() {
      return mode;
    },
    dispose() {
      listen(false);
    },
  };
}
