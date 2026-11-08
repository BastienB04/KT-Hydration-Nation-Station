import { useEffect, useState } from "react";
import { createController, type Controller } from "./app/controller";
import { createUpdateManager, type UpdateManager } from "./app/updates";
import { migrate } from "./core/migrate";
import { createPlatform } from "./platform";
import { Shell } from "./app/Shell";
import { Setup } from "./screens/Setup";
import { AppProvider, useData } from "./state/AppContext";
import { createAppStore, type AppStore } from "./state/store";
import { themeController } from "./theme/boot";

interface Ready {
  store: AppStore;
  controller: Controller;
  updates: UpdateManager;
  platformKind: "tauri" | "browser";
}

function Root() {
  const data = useData();
  useEffect(() => themeController.setMode(data.settings.theme), [data.settings.theme]);
  return data.settings.setupDone ? <Shell /> : <Setup />;
}

export default function App() {
  const [ready, setReady] = useState<Ready | null>(null);

  useEffect(() => {
    let disposed = false;
    let platform: Awaited<ReturnType<typeof createPlatform>> | undefined;
    let controller: Controller | undefined;
    let updates: UpdateManager | undefined;

    (async () => {
      const pl = await createPlatform();
      if (disposed) {
        pl.dispose();
        return;
      }
      platform = pl;

      let raw: unknown;
      let loadFailed = false;
      try {
        raw = await pl.persistence.load();
      } catch {
        loadFailed = true;
      }

      const { data, changed } = migrate(raw);
      const store = createAppStore({
        data,
        ui: { saveError: loadFailed ? "Couldn't read your saved data; starting fresh." : null, notificationsBlocked: false },
      });
      controller = createController({
        store,
        platform: pl,
        applyAutostartOnSetup: import.meta.env.PROD,
      });
      updates = createUpdateManager({
        store,
        platform: pl,
        prepareInstall: controller.prepareUpdate,
      });

      if (disposed) {
        updates.dispose();
        controller.dispose();
        pl.dispose();
        return;
      }

      setReady({ store, controller, updates, platformKind: pl.kind });
      await controller.start();
      if (changed) controller.persist();
      if (!disposed) await updates.start();
    })();

    return () => {
      disposed = true;
      updates?.dispose();
      controller?.dispose();
      platform?.dispose();
    };
  }, []);

  if (!ready) {
    return <p role="status">Ribbit is waking up…</p>;
  }

  return (
    <AppProvider
      store={ready.store}
      controller={ready.controller}
      updates={ready.updates}
      platformKind={ready.platformKind}
    >
      <Root />
    </AppProvider>
  );
}
