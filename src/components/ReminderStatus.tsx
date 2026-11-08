/**
 * Compact reminder card: the current reminder status, Snooze and the Pause
 * disclosure. Recomputes on every render and on the shared 30-second UI clock
 * so "next" stays roughly current even when nothing else changes.
 */
import { describeDecision } from "../core/format";
import { evaluate } from "../core/scheduler";
import { useController, useData, useRoot, useUiClock } from "../state/AppContext";
import { Glyph } from "./Glyph";
import { PauseMenu } from "./PauseMenu";

export function ReminderStatus() {
  const controller = useController();
  const data = useData();
  const { ui } = useRoot();
  useUiClock();

  const decision = evaluate(data, Date.now());
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
