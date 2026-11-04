/**
 * The app shell once setup is done: header with the frog's name, the active
 * screen, a save-error banner and the bottom navigation.
 */
import { useState } from "react";
import { useData, useRoot } from "../state/AppContext";
import { Home } from "../screens/Home";
import { History } from "../screens/History";
import { Settings } from "../screens/Settings";
import { About } from "../screens/About";

type Screen = "home" | "history" | "settings" | "about";

const NAV: { id: Screen; label: string }[] = [
  { id: "home", label: "Pond" },
  { id: "history", label: "Week" },
  { id: "settings", label: "Settings" },
  { id: "about", label: "About" },
];

export function Shell() {
  const [screen, setScreen] = useState<Screen>("home");
  const data = useData();
  const { ui } = useRoot();

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__brand">{data.settings.frogName}</span>
      </header>

      {ui.saveError && (
        <p className="banner banner--alert" role="alert">
          {ui.saveError}
        </p>
      )}

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
