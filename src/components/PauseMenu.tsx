/**
 * "Pause" disclosure: a toggle button that shows a small panel of pause
 * lengths (and "Resume reminders" first while paused). Choosing an option or
 * pressing Escape closes the panel and returns focus to the toggle; a pointer
 * press outside closes it and leaves focus where the user pressed. A
 * disclosure (not an ARIA menu) keeps native Tab, Enter and Space behaviour.
 */
import { useEffect, useId, useRef, useState } from "react";
import { useController } from "../state/AppContext";
import { Glyph } from "./Glyph";

export function PauseMenu({ paused }: { paused: boolean }) {
  const controller = useController();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function choose(action: () => void) {
    action();
    close();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (open && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className="pause-menu" ref={wrapRef} onKeyDown={onKeyDown}>
      <button
        ref={toggleRef}
        type="button"
        className="btn btn--small btn--pill pause-menu__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{paused ? "Paused" : "Pause"}</span>
        <Glyph name="icon/chev" />
      </button>
      <div id={panelId} className="pause-menu__panel" hidden={!open}>
        {paused && (
          <button
            type="button"
            className="btn btn--small btn--primary pause-menu__option"
            onClick={() => choose(() => controller.resume())}
          >
            Resume reminders
          </button>
        )}
        <button
          type="button"
          className="btn btn--small pause-menu__option"
          aria-label="Pause 30 min"
          onClick={() => choose(() => controller.pauseFor(30))}
        >
          30 min
        </button>
        <button
          type="button"
          className="btn btn--small pause-menu__option"
          aria-label="Pause 1 h"
          onClick={() => choose(() => controller.pauseFor(60))}
        >
          1 h
        </button>
        <button
          type="button"
          className="btn btn--small pause-menu__option"
          aria-label="Pause 2 h"
          onClick={() => choose(() => controller.pauseFor(120))}
        >
          2 h
        </button>
        <button
          type="button"
          className="btn btn--small pause-menu__option"
          aria-label="Pause rest of day"
          onClick={() => choose(() => controller.pauseRestOfDay())}
        >
          Rest of day
        </button>
      </div>
    </div>
  );
}
