/**
 * Today's sips, newest first, collapsed to the newest COLLAPSED_COUNT with a
 * "Show all" toggle, plus inline edit and delete. Rows keep each entry's
 * original array index, which is what editEntry/deleteEntry expect. Focus
 * returns to the heading after a delete so keyboard users keep their place.
 */
import { useId, useRef, useState } from "react";
import { formatClock, formatMl } from "../core/format";
import type { Entry } from "../core/schema";
import { parseAmount } from "../core/settings";
import { todayKey } from "../core/stats";
import { parseIso } from "../core/time";
import { useController, useData } from "../state/AppContext";
import { Glyph } from "./Glyph";

export const COLLAPSED_COUNT = 3;

export function TodayList() {
  const controller = useController();
  const data = useData();
  const key = todayKey(Date.now());
  const entries = data.log[key] ?? [];
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listId = useId();

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

  // Newest first, each row remembering its index in the stored (oldest-first) array.
  const rows = entries.map((entry, index) => ({ entry, index })).reverse();
  const collapsible = rows.length > COLLAPSED_COUNT;
  const visible = collapsible && !expanded ? rows.slice(0, COLLAPSED_COUNT) : rows;

  return (
    <section className="card sips-card">
      <div className="sips-card__head">
        <h3 className="card__title" tabIndex={-1} ref={headingRef}>
          Today's sips
        </h3>
        {collapsible && (
          <button
            type="button"
            className="btn btn--small btn--ghost sips-card__toggle"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((x) => !x)}
          >
            {expanded ? "Show fewer" : `${rows.length} sips · Show all`}
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="screen__hint">No sips logged yet. Ribbit is waiting patiently.</p>
      ) : (
        <ul id={listId} className="sips-card__list">
          {visible.map(({ entry, index }) => {
            const ms = parseIso(entry.t) ?? Date.now();
            const time = formatClock(ms);
            return (
              <li key={entry.t} className="sips-card__row">
                {editing === index ? (
                  <form
                    className="sips-card__edit"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit(index, entry);
                    }}
                    noValidate
                  >
                    <label htmlFor={`edit-${index}`}>Amount (ml) at {time}</label>
                    <input
                      id={`edit-${index}`}
                      className="input sips-card__edit-input"
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
                    <Glyph name="prop/water-drop" className="sips-card__drop" />
                    <span className="sips-card__time">{time}</span>
                    <span className="sips-card__amount">{formatMl(entry.ml)} ml</span>
                    <button
                      type="button"
                      className="btn btn--icon"
                      aria-label={`Edit ${entry.ml} ml at ${time}`}
                      onClick={() => startEdit(index, entry)}
                    >
                      <Glyph name="icon/pencil" />
                    </button>
                    <button
                      type="button"
                      className="btn btn--icon"
                      aria-label={`Delete ${entry.ml} ml at ${time}`}
                      onClick={() => remove(index, entry)}
                    >
                      <Glyph name="icon/x" />
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
