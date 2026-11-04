import { useEffect, useState } from "react";
import { startRuntime, type Runtime, type RuntimeKind } from "./core/runtime";
import { Home } from "./screens/Home";
import { History } from "./screens/History";
import { Settings } from "./screens/Settings";
import { About } from "./screens/About";

export type Screen = "home" | "history" | "settings" | "about";

const NAV: { id: Screen; label: string }[] = [
  { id: "home", label: "Pond" },
  { id: "history", label: "Week" },
  { id: "settings", label: "Settings" },
  { id: "about", label: "About" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [ticks, setTicks] = useState(0);
  const [runtimeKind, setRuntimeKind] = useState<RuntimeKind | "starting">("starting");

  useEffect(() => {
    let disposed = false;
    let runtime: Runtime | undefined;

    startRuntime({ onTick: () => setTicks((n) => n + 1) }).then((rt) => {
      if (disposed) {
        rt.dispose();
        return;
      }
      runtime = rt;
      setRuntimeKind(rt.kind);
    });

    return () => {
      disposed = true;
      runtime?.dispose();
    };
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__brand">Ribbit</span>
        <span className="app__status" title="Phase 2 skeleton: proves the Rust ticker reaches the UI">
          {runtimeKind} · ticks {ticks}
        </span>
      </header>

      <main className="app__main">
        {screen === "home" && <Home />}
        {screen === "history" && <History />}
        {screen === "settings" && <Settings />}
        {screen === "about" && <About />}
      </main>

      <nav className="app__nav" aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === screen ? "nav__item nav__item--active" : "nav__item"}
            aria-current={item.id === screen ? "page" : undefined}
            onClick={() => setScreen(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
