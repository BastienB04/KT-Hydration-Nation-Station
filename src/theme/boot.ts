/**
 * Imported first by `main.tsx`: applies the mirrored theme synchronously
 * before React renders, then exports the singleton the app keeps in sync with
 * `settings.theme`.
 */
import { createThemeController, readMirroredMode, type ThemeStorage } from "./theme";

function safeStorage(): ThemeStorage | null {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

const storage = safeStorage();

export const themeController = createThemeController({
  root: document.documentElement,
  media: window.matchMedia?.("(prefers-color-scheme: dark)") ?? null,
  storage,
});

themeController.setMode(readMirroredMode(storage));
