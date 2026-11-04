/**
 * React access to the external store and controller. Components read state
 * through useSyncExternalStore, so the store stays the single source of truth.
 */
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Controller } from "../app/controller";
import type { AppStore } from "./store";
import type { RootState } from "./reducer";

interface AppContextValue {
  store: AppStore;
  controller: Controller;
  platformKind: "tauri" | "browser";
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  store,
  controller,
  platformKind,
  children,
}: AppContextValue & { children: ReactNode }) {
  return (
    <AppContext.Provider value={{ store, controller, platformKind }}>{children}</AppContext.Provider>
  );
}

function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) throw new Error("useAppContext must be used within <AppProvider>");
  return ctx;
}

export function useRoot(): RootState {
  const { store } = useAppContext();
  return useSyncExternalStore(store.subscribe, store.getState);
}

export function useData() {
  return useRoot().data;
}

export function useController(): Controller {
  return useAppContext().controller;
}

export function usePlatformKind(): "tauri" | "browser" {
  return useAppContext().platformKind;
}
