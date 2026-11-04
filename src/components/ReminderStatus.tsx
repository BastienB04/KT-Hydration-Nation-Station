/**
 * Shows the current reminder status and the pause/snooze controls. Recomputes
 * on every render and on a 30-second clock so "next" stays roughly current
 * even when nothing else changes.
 */
import { useEffect, useState } from "react";
import { describeDecision } from "../core/format";
import { evaluate } from "../core/scheduler";
import { useController, useData, useRoot } from "../state/AppContext";

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
    <section className="reminder">
      <p className="reminder__status">{describeDecision(decision)}</p>

      {ui.notificationsBlocked && (
        <p className="banner banner--warn" role="status">
          Notifications are off, so reminders stay in the app. Turn them on in your system settings
          to get a nudge.
        </p>
      )}

      <div className="reminder__controls">
        <button type="button" className="btn btn--small" onClick={() => controller.snooze()}>
          Snooze {data.settings.snoozeMin} min
        </button>
        <button type="button" className="btn btn--small" onClick={() => controller.pauseFor(30)}>
          Pause 30 min
        </button>
        <button type="button" className="btn btn--small" onClick={() => controller.pauseFor(60)}>
          Pause 1 h
        </button>
        <button type="button" className="btn btn--small" onClick={() => controller.pauseFor(120)}>
          Pause 2 h
        </button>
        <button type="button" className="btn btn--small" onClick={() => controller.pauseRestOfDay()}>
          Rest of day
        </button>
        {paused && (
          <button type="button" className="btn btn--small btn--primary" onClick={() => controller.resume()}>
            Resume
          </button>
        )}
      </div>
    </section>
  );
}
