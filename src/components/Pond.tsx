/**
 * The "Today" card: today's total against the goal, a progress bar and
 * Ribbit's mood, with Ribbit peeking over the card. When the goal is reached
 * while this card is on screen (the controller records lastCelebratedDate),
 * Ribbit cheers once with a small burst for CELEBRATE_MS, then settles back to
 * the steady hydrated pose. Re-renders on the shared UI clock, so the pose
 * and label follow time-only changes (a pause ending, active hours ending).
 */
import { useEffect, useRef, useState } from "react";
import { formatMl } from "../core/format";
import { moodLabel, pondMood } from "../core/mood";
import type { PersistedData } from "../core/schema";
import { progress, todayKey, todayTotal } from "../core/stats";
import { useUiClock } from "../state/AppContext";
import { Glyph, type GlyphName } from "./Glyph";
import { PeekHeader } from "./PeekHeader";
import { Ribbit } from "./Ribbit";

export const CELEBRATE_MS = 2400;

const BURST: GlyphName[] = [
  "prop/water-drop",
  "prop/sparkle",
  "prop/heart",
  "prop/water-drop",
  "prop/sparkle",
  "prop/heart",
  "prop/sparkle",
];

export function Pond({ data }: { data: PersistedData }) {
  useUiClock();
  const now = Date.now();
  const total = todayTotal(data.log, now);
  const goal = data.settings.dailyGoalMl;
  const percent = Math.round(progress(total, goal) * 100);
  const valueText = `${formatMl(total)} of ${formatMl(goal)} ml`;
  const today = todayKey(now);

  const celebratedDate = data.state.lastCelebratedDate;
  const previousCelebrated = useRef(celebratedDate);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const before = previousCelebrated.current;
    previousCelebrated.current = celebratedDate;
    if (celebratedDate === today && before !== today) setCelebrating(true);
  }, [celebratedDate, today]);

  useEffect(() => {
    if (!celebrating) return;
    const id = window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => window.clearTimeout(id);
  }, [celebrating]);

  const pose = celebrating ? "celebrate" : pondMood(data, now);
  const label = moodLabel(pose, data.settings.frogName);
  const edge = percent > 0 && percent < 100;

  return (
    <>
      <PeekHeader title="Pond">
        <Ribbit pose={pose} variant="peek" label={label} />
        {celebrating && (
          <span className="burst" aria-hidden="true">
            {BURST.map((name, i) => (
              <Glyph key={i} name={name} className={`burst__piece burst__piece--${i + 1}`} />
            ))}
          </span>
        )}
      </PeekHeader>
      <section className="card today-card" aria-labelledby="today-card-label">
        <p id="today-card-label" className="card__label">
          Today
        </p>
        <p className="today-card__total">
          <span className="today-card__number">{formatMl(total)}</span>
          <span className="today-card__goal">/ {formatMl(goal)} ml</span>
        </p>
        <div
          className="meter"
          role="progressbar"
          aria-label="Progress to today's goal"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={Math.min(total, goal)}
          aria-valuetext={valueText}
        >
          <span
            className={edge ? "meter__fill meter__fill--edge" : "meter__fill"}
            style={{ width: `${percent}%` }}
            aria-hidden="true"
          />
          <Glyph name="prop/water-drop" className="meter__drop" />
        </div>
        <p className="today-card__row">
          <strong>{percent} %</strong>
          <span className="today-card__mood">{label}</span>
        </p>
      </section>
    </>
  );
}
