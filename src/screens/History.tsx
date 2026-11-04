/** Last-7-days view with a goal comparison and the current streak. No chart library. */
import { formatDayLabel, formatMl } from "../core/format";
import { lastSevenDays, streak } from "../core/stats";
import { useData } from "../state/AppContext";

export function History() {
  const data = useData();
  const now = Date.now();
  const goal = data.settings.dailyGoalMl;
  const days = lastSevenDays(data.log, now, goal);
  const run = streak(data.log, now, goal);

  return (
    <section className="screen">
      <h2 className="screen__title">This week</h2>
      <p className="history__streak">
        {run > 0 ? `${run}-day streak` : "No streak yet: today's a good day to start"}
      </p>
      <ol className="history__list">
        {days.map((day) => {
          const width = Math.min(day.total / goal, 1.25);
          return (
            <li key={day.key} className="history__row">
              <span className="history__label">{day.isToday ? "Today" : formatDayLabel(day.key)}</span>
              <span className="history__bar-track" aria-hidden="true">
                <span
                  className={day.met ? "history__bar history__bar--met" : "history__bar"}
                  style={{ width: `${width * 100}%` }}
                />
                <span className="history__goal-marker" />
              </span>
              <span className="history__value">
                {formatMl(day.total)} / {formatMl(goal)} ml{day.met ? " · Goal met" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
