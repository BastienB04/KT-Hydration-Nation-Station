import { describe, expect, it } from "vitest";
import {
  createThemeController,
  readMirroredMode,
  resolveTheme,
  THEME_MIRROR_KEY,
  type ThemeStorage,
} from "./theme";

function fakeEnv(prefersDark = false, storage: ThemeStorage | null = memoryStorage()) {
  const attrs: Record<string, string> = {};
  const listeners = new Set<() => void>();
  let adds = 0;
  const media = {
    matches: prefersDark,
    addEventListener(_type: "change", cb: () => void) {
      adds += 1;
      listeners.add(cb);
    },
    removeEventListener(_type: "change", cb: () => void) {
      listeners.delete(cb);
    },
  };
  const root = {
    style: { colorScheme: "" },
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
  };
  return {
    env: { root, media, storage },
    attrs,
    root,
    listenerCount: () => listeners.size,
    addCount: () => adds,
    osChange(dark: boolean) {
      media.matches = dark;
      for (const cb of [...listeners]) cb();
    },
  };
}

function memoryStorage(initial: Record<string, string> = {}): ThemeStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe("resolveTheme", () => {
  it("follows the OS only in system mode", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("createThemeController", () => {
  it("system mode follows the media query and its change events", () => {
    const f = fakeEnv(false);
    const c = createThemeController(f.env);
    c.setMode("system");
    expect(f.attrs["data-theme"]).toBe("light");
    expect(f.attrs["data-theme-mode"]).toBe("system");
    expect(f.root.style.colorScheme).toBe("light");
    expect(f.listenerCount()).toBe(1);
    f.osChange(true);
    expect(f.attrs["data-theme"]).toBe("dark");
    expect(f.root.style.colorScheme).toBe("dark");
  });

  it("light and dark ignore OS changes and hold no listener", () => {
    for (const mode of ["light", "dark"] as const) {
      const f = fakeEnv(mode === "light");
      const c = createThemeController(f.env);
      c.setMode("system");
      c.setMode(mode);
      expect(f.listenerCount()).toBe(0);
      expect(f.attrs["data-theme"]).toBe(mode);
      expect(f.attrs["data-theme-mode"]).toBe(mode);
      f.osChange(mode === "dark" ? false : true);
      expect(f.attrs["data-theme"]).toBe(mode);
      expect(f.root.style.colorScheme).toBe(mode);
    }
  });

  it("re-attaches exactly once when switching back to system, and is idempotent", () => {
    const f = fakeEnv(true);
    const c = createThemeController(f.env);
    c.setMode("dark");
    expect(f.addCount()).toBe(0);
    c.setMode("system");
    c.setMode("system");
    expect(f.addCount()).toBe(1);
    expect(f.listenerCount()).toBe(1);
    expect(c.getMode()).toBe("system");
  });

  it("dispose removes the listener", () => {
    const f = fakeEnv(false);
    const c = createThemeController(f.env);
    c.setMode("system");
    c.dispose();
    expect(f.listenerCount()).toBe(0);
    f.osChange(true);
    expect(f.attrs["data-theme"]).toBe("light");
  });

  it("mirrors the mode to storage", () => {
    const storage = memoryStorage();
    const f = fakeEnv(false, storage);
    const c = createThemeController(f.env);
    c.setMode("dark");
    expect(storage.data[THEME_MIRROR_KEY]).toBe("dark");
  });

  it("tolerates storage that throws and a missing media query", () => {
    const throwing: ThemeStorage = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("denied");
      },
    };
    const f = fakeEnv(false, throwing);
    const c = createThemeController({ ...f.env, media: null });
    expect(() => c.setMode("dark")).not.toThrow();
    expect(f.attrs["data-theme"]).toBe("dark");
    c.setMode("system");
    expect(f.attrs["data-theme"]).toBe("light");
    expect(readMirroredMode(throwing)).toBe("system");
  });
});

describe("readMirroredMode", () => {
  it("returns valid modes and defaults junk or missing values to system", () => {
    expect(readMirroredMode(memoryStorage({ [THEME_MIRROR_KEY]: "dark" }))).toBe("dark");
    expect(readMirroredMode(memoryStorage({ [THEME_MIRROR_KEY]: "light" }))).toBe("light");
    expect(readMirroredMode(memoryStorage({ [THEME_MIRROR_KEY]: "Dark" }))).toBe("system");
    expect(readMirroredMode(memoryStorage({ [THEME_MIRROR_KEY]: "{}" }))).toBe("system");
    expect(readMirroredMode(memoryStorage())).toBe("system");
    expect(readMirroredMode(null)).toBe("system");
  });
});
