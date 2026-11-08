/**
 * Week: the current streak with its caption, a lily-pad row, a seven-day bar
 * chart against the goal and a weekly summary. No chart library; the bars and
 * pads are decorative and each day's full text is visually hidden.
 */
import { Glyph } from "../components/Glyph";
import { PeekHeader } from "../components/PeekHeader";
import { Ribbit } from "../components/Ribbit";
import { formatDayLong, formatMl, formatWeekdayShort } from "../core/format";
import { lastSevenDays, streak } from "../core/stats";
import { streakCaption, weekSummary } from "../core/week";
import { useData } from "../state/AppContext";

/** Bars are scaled so 125 % of the goal fills the plot; the goal line sits at 80 %. */
const BAR_CAP = 1.25;

export function History() {
  const data = useData();
  const now = Date.now();
  const goal = data.settings.dailyGoalMl;
  const days = lastSevenDays(data.log, now, goal);
  const run = streak(data.log, now, goal);
  const summary = weekSummary(days);

  return (
    <section className="screen">
      <PeekHeader title="This week">
        <Ribbit pose="happy" variant="peek" />
      </PeekHeader>

      <section className="card streak-card">
        <p className="streak-card__run">
          <span className="streak-card__number">{run}</span>
          <span className="streak-card__unit">day streak</span>
        </p>
        <p className="streak-card__caption">{streakCaption(days, run)}</p>
        <div className="streak-card__pads" aria-hidden="true">
          {days.map((day) =>
            day.met ? (
              <Glyph key={day.key} name="prop/lily-pad-flower" />
            ) : day.isToday ? (
              <span key={day.key} className="streak-card__today-pad" />
            ) : (
              <Glyph key={day.key} name="prop/lily-pad" />
            ),
          )}
        </div>
      </section>

      <section className="card week-chart" aria-labelledby="week-chart-title">
        <div className="week-chart__head">
          <h3 id="week-chart-title" className="card__title">
            Sips per day
          </h3>
          <p className="week-chart__legend">
            <span className="week-chart__legend-line" aria-hidden="true" />
            goal {formatMl(goal)}
          </p>
        </div>
        <div className="week-chart__body">
          <ol className="week-chart__cols" aria-label="Last seven days">
            {days.map((day) => {
              const height = (Math.min(day.total / goal, BAR_CAP) / BAR_CAP) * 100;
              const classes = ["week-chart__bar"];
              if (day.isToday) classes.push("week-chart__bar--today");
              const label = day.isToday ? "Today" : formatWeekdayShort(day.key);
              return (
                <li key={day.key} className="week-chart__col">
                  <span className="week-chart__plot" aria-hidden="true">
                    {day.total > 0 && (
                      <span className={classes.join(" ")} style={{ height: `${height}%` }}>
                        {day.met && <Glyph name="prop/heart" className="week-chart__heart" />}
                      </span>
                    )}
                  </span>
                  <span className="week-chart__day" aria-hidden="true">
                    {label}
                  </span>
                  <span className="week-chart__value" aria-hidden="true">
                    {formatMl(day.total)}
                  </span>
                  <span className="visually-hidden">
                    {day.isToday ? "Today, " : ""}
                    {formatDayLong(day.key)}: {formatMl(day.total)} of {formatMl(goal)} ml
                    {day.met ? ", goal met" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
          <span className="week-chart__goal-line" aria-hidden="true" />
          <span className="week-chart__axis" aria-hidden="true" />
        </div>
      </section>

      <section className="card week-summary">
        <p>
          Average <strong>{formatMl(summary.averageMl)} ml</strong> ·{" "}
          <strong>
            {summary.metCount} of {days.length}
          </strong>{" "}
          days at goal
        </p>
      </section>
    </section>
  );
}
