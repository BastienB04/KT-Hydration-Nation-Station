/**
 * Compact reminder card: the current reminder status, Snooze and the Pause
 * disclosure. Recomputes on every render and on a 30-second clock so "next"
 * stays roughly current even when nothing else changes.
 */
import { useEffect, useState } from "react";
import { describeDecision } from "../core/format";
import { evaluate } from "../core/scheduler";
import { useController, useData, useRoot } from "../state/AppContext";
import { Glyph } from "./Glyph";
import { PauseMenu } from "./PauseMenu";

const CLOCK_MS = 30_000;

export function ReminderStatus() {
  const controller = useController();
  const data = useData();
  const { ui } = useRoot();
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), CLOCK_MS);
    return () => window.clearInterval(id);
  }, []);

  const decision = evaluate(data, clock);
  const paused = decision.kind === "paused";

  return (
    <section className="card reminder-card">
      <div className="reminder-card__main">
        <Glyph name={decision.kind === "goal-met" ? "icon/check" : "icon/bell"} />
        <p className="reminder-card__status">{describeDecision(decision)}</p>
        <div className="reminder-card__controls">
          <button type="button" className="btn btn--small btn--pill" onClick={() => controller.snooze()}>
            Snooze {data.settings.snoozeMin} min
          </button>
          <PauseMenu paused={paused} />
        </div>
      </div>

      {ui.notificationsBlocked && (
        <p className="banner banner--warn" role="status">
          Notifications are off, so reminders stay in the app. Turn them on in your system settings
          to get a nudge.
        </p>
      )}
    </section>
  );
}
