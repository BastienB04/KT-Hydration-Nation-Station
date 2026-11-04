/**
 * Today's sips, with inline edit and delete. Focus returns to a sensible place
 * after a delete or a cancelled edit so keyboard users keep their place.
 */
import { useRef, useState } from "react";
import { formatClock, formatMl } from "../core/format";
import type { Entry } from "../core/schema";
import { parseAmount } from "../core/settings";
import { todayKey } from "../core/stats";
import { parseIso } from "../core/time";
import { useController, useData } from "../state/AppContext";

export function TodayList() {
  const controller = useController();
  const data = useData();
  const key = todayKey(Date.now());
  const entries = data.log[key] ?? [];
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function startEdit(index: number, entry: Entry) {
    setEditing(index);
    setDraft(String(entry.ml));
    setError(null);
  }

  function saveEdit(index: number, entry: Entry) {
    const result = parseAmount(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    controller.editEntry(key, index, entry.t, result.ml);
    setEditing(null);
  }

  function cancelEdit() {
    setEditing(null);
    setError(null);
  }

  function remove(index: number, entry: Entry) {
    controller.deleteEntry(key, index, entry.t);
    headingRef.current?.focus();
  }

  return (
    <section className="today">
      <h3 className="section__title" tabIndex={-1} ref={headingRef}>
        Today's sips
      </h3>
      {entries.length === 0 ? (
        <p className="screen__hint">No sips logged yet. Ribbit is waiting patiently.</p>
      ) : (
        <ul className="today__list">
          {entries.map((entry, index) => {
            const ms = parseIso(entry.t) ?? Date.now();
            const time = formatClock(ms);
            return (
              <li key={entry.t} className="today__row">
                {editing === index ? (
                  <form
                    className="today__edit"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit(index, entry);
                    }}
                    noValidate
                  >
                    <label htmlFor={`edit-${index}`}>Amount (ml) at {time}</label>
                    <input
                      id={`edit-${index}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={5000}
                      step={1}
                      value={draft}
                      autoFocus
                      onChange={(e) => setDraft(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `edit-err-${index}` : undefined}
                    />
                    <button type="submit" className="btn btn--small">
                      Save
                    </button>
                    <button type="button" className="btn btn--small btn--ghost" onClick={cancelEdit}>
                      Cancel
                    </button>
                    {error && (
                      <p id={`edit-err-${index}`} className="field-error" role="alert">
                        {error}
                      </p>
                    )}
                  </form>
                ) : (
                  <>
                    <span className="today__time">{time}</span>
                    <span className="today__amount">{formatMl(entry.ml)} ml</span>
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => startEdit(index, entry)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      aria-label={`Delete ${entry.ml} ml at ${time}`}
                      onClick={() => remove(index, entry)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
