/**
 * "Log a sip" card: three quick-add buttons, a validated custom-amount field
 * and undo. Announces each action in a polite live region for screen readers.
 */
import { useId, useState } from "react";
import { parseAmount } from "../core/settings";
import { todayEntries } from "../core/stats";
import { useController, useData } from "../state/AppContext";
import { Glyph } from "./Glyph";

/** Drop glyph size by button position: small, medium, large. */
const DROP_SIZES = ["sip-btn__drop--s", "sip-btn__drop--m", "sip-btn__drop--l"];

export function QuickAdd({ hasEntriesToday }: { hasEntriesToday: boolean }) {
  const controller = useController();
  const data = useData();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const errorId = useId();

  function log(ml: number) {
    if (controller.logDrink(ml)) setAnnounce(`Logged ${ml} ml`);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = parseAmount(custom);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    log(result.ml);
    setCustom("");
  }

  function undo() {
    const entries = todayEntries(data.log, Date.now());
    const last = entries[entries.length - 1];
    controller.undoLast();
    if (last) setAnnounce(`Removed ${last.ml} ml`);
  }

  return (
    <section className="card quick-card" aria-labelledby={`${errorId}-h`}>
      <h3 id={`${errorId}-h`} className="card__title">
        Log a sip
      </h3>
      <div className="quick-card__buttons">
        {data.settings.quickAddMl.map((ml, i) => (
          <button
            key={i}
            type="button"
            className="btn sip-btn"
            aria-label={`+${ml} ml`}
            onClick={() => log(ml)}
          >
            <Glyph name="prop/water-drop" className={`sip-btn__drop ${DROP_SIZES[i] ?? DROP_SIZES[1]}`} />
            <span>+{ml}</span>
          </button>
        ))}
      </div>

      <form className="quick-card__custom" onSubmit={onSubmit} noValidate>
        <label htmlFor={`${errorId}-input`} className="visually-hidden">
          Custom amount (ml)
        </label>
        <input
          id={`${errorId}-input`}
          className="input quick-card__input"
          type="number"
          inputMode="numeric"
          min={1}
          max={5000}
          step={1}
          placeholder="Custom ml"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button type="submit" className="btn btn--small">
          Add
        </button>
        <button
          type="button"
          className="btn btn--small btn--ghost quick-card__undo"
          aria-label="Undo last sip"
          onClick={undo}
          disabled={!hasEntriesToday}
        >
          <Glyph name="icon/undo" />
          <span>Undo</span>
        </button>
      </form>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}

      <p className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
