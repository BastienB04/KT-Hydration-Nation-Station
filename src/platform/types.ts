/**
 * Platform abstraction. The app logic depends only on these interfaces, so it
 * runs unchanged under Tauri, in a browser preview and in Node tests.
 */
import type { PersistedData } from "../core/schema";

export interface Persistence {
  load(): Promise<unknown>;
  save(data: PersistedData): Promise<void>;
}

export interface Notifier {
  /** Resolve the permission, requesting it if needed; true means allowed. */
  ensurePermission(): Promise<boolean>;
  /** Send a notification; returns false when blocked or unavailable. */
  send(title: string, body: string): Promise<boolean>;
}

export interface Sound {
  ribbit(): void;
}

export interface Autostart {
  supported: boolean;
  isEnabled(): Promise<boolean>;
  setEnabled(on: boolean): Promise<void>;
}

export interface Tray {
  setTooltip(text: string): Promise<void>;
  /** Show the "due" tray icon while a reminder is unanswered. */
  setAttention(due: boolean): Promise<void>;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number | null;
  /** Transfer is complete; signature verification may still be running. */
  finished: boolean;
}

export interface UpdateDownload {
  version: string;
  /** Resolves only after the native signature and signed version are verified. */
  download(onProgress: (progress: DownloadProgress) => void): Promise<void>;
  /** On Windows, starts the installer with restart enabled and exits the app. */
  install(): Promise<void>;
  close(): Promise<void>;
}

export interface Updater {
  supported: boolean;
  check(): Promise<UpdateDownload | null>;
  /** Fallback if installation returns instead of exiting the Windows process. */
  relaunch(): Promise<void>;
}

export interface PlatformEvents {
  onTick(cb: () => void): Promise<() => void>;
  onWake(cb: () => void): Promise<() => void>;
  onTrayLog(cb: (ml: number) => void): Promise<() => void>;
  onTrayPause(cb: (minutes: number) => void): Promise<() => void>;
  /** The user clicked a reminder notification; the window is being restored. */
  onNotificationOpen(cb: () => void): Promise<() => void>;
}

export interface Platform {
  kind: "tauri" | "browser";
  persistence: Persistence;
  notifier: Notifier;
  sound: Sound;
  autostart: Autostart;
  tray: Tray;
  updater: Updater;
  events: PlatformEvents;
}
