/**
 * Quick-add buttons, a validated custom-amount field and undo. Announces each
 * action in a polite live region for screen readers.
 */
import { useId, useState } from "react";
import { parseAmount } from "../core/settings";
import { todayEntries } from "../core/stats";
import { useController, useData } from "../state/AppContext";

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
    <section className="quick-add" aria-labelledby={`${errorId}-h`}>
      <h3 id={`${errorId}-h`} className="section__title">
        Log a sip
      </h3>
      <div className="quick-add__buttons">
        {data.settings.quickAddMl.map((ml, i) => (
          <button key={i} type="button" className="btn btn--primary" onClick={() => log(ml)}>
            +{ml} ml
          </button>
        ))}
      </div>

      <form className="quick-add__custom" onSubmit={onSubmit} noValidate>
        <label htmlFor={`${errorId}-input`}>Custom amount (ml)</label>
        <div className="quick-add__custom-row">
          <input
            id={`${errorId}-input`}
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            step={1}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <button type="submit" className="btn">
            Add
          </button>
        </div>
        {error && (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <button type="button" className="btn btn--ghost" onClick={undo} disabled={!hasEntriesToday}>
        Undo last sip
      </button>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
