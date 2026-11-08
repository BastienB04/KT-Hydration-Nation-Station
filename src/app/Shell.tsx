/**
 * The app shell once setup is done: a visually hidden app heading, the
 * save-error banner, the active screen and the C glyph dock.
 */
import { useEffect, useState } from "react";
import { useController, useRoot } from "../state/AppContext";
import { Home } from "../screens/Home";
import { History } from "../screens/History";
import { Settings } from "../screens/Settings";
import { About } from "../screens/About";
import { Glyph, type GlyphName } from "../components/Glyph";
import { UpdatePanel } from "../components/UpdatePanel";
import { POND_SCREEN, openPondOnNotification, type Screen } from "./navigation";

const NAV: { id: Screen; label: string; glyph: GlyphName }[] = [
  { id: "home", label: "Pond", glyph: "nav/pond" },
  { id: "history", label: "Week", glyph: "nav/week" },
  { id: "settings", label: "Settings", glyph: "nav/settings" },
  { id: "about", label: "About", glyph: "nav/about" },
];

export function Shell() {
  const [screen, setScreen] = useState<Screen>(POND_SCREEN);
  const { ui } = useRoot();
  const controller = useController();

  // A click that arrives before this subscribes needs no replay: the Shell starts on Pond.
  useEffect(() => openPondOnNotification(controller, setScreen), [controller]);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="visually-hidden">KT-Hydration-Nation-Station</h1>
        {ui.saveError && (
          <p className="banner banner--alert" role="alert">
            {ui.saveError}
          </p>
        )}
      </header>
      <main className="app__main">
        {screen !== "about" && <UpdatePanel notice />}
        {screen === "home" && <Home />}
        {screen === "history" && <History />}
        {screen === "settings" && <Settings />}
        {screen === "about" && <About />}
      </main>
      <nav className="dock" aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className="dock__item"
            aria-current={item.id === screen ? "page" : undefined}
            onClick={() => setScreen(item.id)}
          >
            <Glyph name={item.glyph} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
