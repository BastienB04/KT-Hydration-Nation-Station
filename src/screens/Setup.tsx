/** First-run setup: three short steps (goal, active hours, frog name), then Home. */
import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, LIMITS } from "../core/schema";
import { parseHHMM } from "../core/time";
import { parseAmount } from "../core/settings";
import { FLUID_DISCLAIMER } from "../core/tips";
import { useController } from "../state/AppContext";

export function Setup() {
  const controller = useController();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(String(DEFAULT_SETTINGS.dailyGoalMl));
  const [start, setStart] = useState(DEFAULT_SETTINGS.activeHours.start);
  const [end, setEnd] = useState(DEFAULT_SETTINGS.activeHours.end);
  const [frogName, setFrogName] = useState(DEFAULT_SETTINGS.frogName);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    setError(null);
  }, [step]);

  function next() {
    if (step === 1) {
      const result = parseAmount(goal);
      if (!result.ok || result.ml < LIMITS.goalMinMl || result.ml > LIMITS.goalMaxMl) {
        setError(`Goal must be ${LIMITS.goalMinMl}–${LIMITS.goalMaxMl} ml.`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const s = parseHHMM(start);
      const e = parseHHMM(end);
      if (s === null || e === null || s >= e) {
        setError("End time must be after the start time.");
        return;
      }
      setStep(3);
    }
  }

  function finish() {
    const name = frogName.trim();
    if (name === "") {
      setError("Give your frog a name.");
      return;
    }
    controller.completeSetup({
      dailyGoalMl: Number(goal),
      activeHours: { start, end },
      frogName: name,
    });
  }

  return (
    <section className="screen setup">
      <p className="setup__step">Step {step} of 3</p>

      {step === 1 && (
        <div className="setup__panel">
          <h2 className="screen__title" tabIndex={-1} ref={headingRef}>
            Your daily goal
          </h2>
          <div className="field">
            <label htmlFor="setup-goal">Daily goal (ml)</label>
            <input
              id="setup-goal"
              type="number"
              inputMode="numeric"
              min={LIMITS.goalMinMl}
              max={LIMITS.goalMaxMl}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby="setup-error"
            />
          </div>
          <p className="tip-card__disclaimer">{FLUID_DISCLAIMER}</p>
        </div>
      )}

      {step === 2 && (
        <div className="setup__panel">
          <h2 className="screen__title" tabIndex={-1} ref={headingRef}>
            Your active hours
          </h2>
          <div className="field settings__hours">
            <label htmlFor="setup-start">Start</label>
            <input id="setup-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            <label htmlFor="setup-end">End</label>
            <input id="setup-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <p className="screen__hint">You can pick days and other options later in Settings.</p>
        </div>
      )}

      {step === 3 && (
        <div className="setup__panel">
          <h2 className="screen__title" tabIndex={-1} ref={headingRef}>
            Name your frog
          </h2>
          <div className="field">
            <label htmlFor="setup-name">Frog name</label>
            <input
              id="setup-name"
              type="text"
              maxLength={24}
              value={frogName}
              onChange={(e) => setFrogName(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby="setup-error"
            />
          </div>
        </div>
      )}

      {error && (
        <p id="setup-error" className="field-error" role="alert">
          {error}
        </p>
      )}

      <div className="setup__nav">
        {step > 1 && (
          <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button type="button" className="btn btn--primary" onClick={next}>
            Next
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={finish}>
            Hop in
          </button>
        )}
      </div>
    </section>
  );
}
