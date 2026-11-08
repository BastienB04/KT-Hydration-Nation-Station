/**
 * First-run setup: three short steps (goal, active hours, frog name) on one
 * card with Ribbit waving over it, then Home. The goal step has a -/+ 100 ml
 * stepper around the same validated number field.
 */
import { useEffect, useRef, useState } from "react";
import { Ribbit } from "../components/Ribbit";
import { Glyph } from "../components/Glyph";
import { DEFAULT_SETTINGS, LIMITS } from "../core/schema";
import { parseHHMM } from "../core/time";
import { parseGoal, stepGoal } from "../core/settings";
import { FLUID_DISCLAIMER, tipAt } from "../core/tips";
import { useController } from "../state/AppContext";

const STEPS = 3;
const GOAL_STEP_ML = 100;
/** "Little and often is the frog way. No need to leap all at once." */
const SETUP_TIP_INDEX = 32;

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
      if (parseGoal(goal) === null) {
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
      dailyGoalMl: parseGoal(goal) ?? DEFAULT_SETTINGS.dailyGoalMl,
      activeHours: { start, end },
      frogName: name,
    });
  }

  const parsedGoal = parseGoal(goal);

  return (
    <section className="screen setup">
      <div className="setup__top">
        <span className="pill">
          Step {step} of {STEPS}
        </span>
        <span className="setup__pips" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={i < step ? "setup__pip setup__pip--done" : "setup__pip"} />
          ))}
        </span>
      </div>

      <div className="setup__hero">
        {step === 1 && <p className="setup__bubble">Hi! I'm Ribbit.</p>}
        <Ribbit pose="wave" variant="peek" className="setup__frog" />
      </div>

      <div className="card setup__card">
        {step === 1 && (
          <>
            <h2 className="setup__title" tabIndex={-1} ref={headingRef}>
              Your daily goal
            </h2>
            <p className="setup__subtitle">How much should we sip each day?</p>
            <label htmlFor="setup-goal" className="setup__label">
              Daily goal (ml)
            </label>
            <div className="stepper">
              <button
                type="button"
                className="btn stepper__btn"
                aria-label={`Decrease daily goal by ${GOAL_STEP_ML} ml`}
                disabled={parsedGoal !== null && parsedGoal <= LIMITS.goalMinMl}
                onClick={() => setGoal(stepGoal(goal, -GOAL_STEP_ML))}
              >
                <Glyph name="icon/minus" />
              </button>
              <span className="stepper__value">
                <input
                  id="setup-goal"
                  className="stepper__input"
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.goalMinMl}
                  max={LIMITS.goalMaxMl}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby="setup-error"
                />
                <span className="stepper__unit" aria-hidden="true">
                  ml a day
                </span>
              </span>
              <button
                type="button"
                className="btn stepper__btn"
                aria-label={`Increase daily goal by ${GOAL_STEP_ML} ml`}
                disabled={parsedGoal !== null && parsedGoal >= LIMITS.goalMaxMl}
                onClick={() => setGoal(stepGoal(goal, GOAL_STEP_ML))}
              >
                <Glyph name="icon/plus" />
              </button>
            </div>
            <p className="setup__note">{FLUID_DISCLAIMER}</p>
            <p className="setup__tip">{tipAt(SETUP_TIP_INDEX)}</p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="setup__title" tabIndex={-1} ref={headingRef}>
              Your active hours
            </h2>
            <p className="setup__subtitle">When should Ribbit remind you?</p>
            <div className="setup__hours">
              <span className="field">
                <label htmlFor="setup-start" className="setup__label">
                  Start
                </label>
                <input
                  id="setup-start"
                  className="input"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </span>
              <span className="field">
                <label htmlFor="setup-end" className="setup__label">
                  End
                </label>
                <input
                  id="setup-end"
                  className="input"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </span>
            </div>
            <p className="setup__note">You can pick days and other options later in Settings.</p>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="setup__title" tabIndex={-1} ref={headingRef}>
              Name your frog
            </h2>
            <p className="setup__subtitle">You can change it later in Settings.</p>
            <span className="field">
              <label htmlFor="setup-name" className="setup__label">
                Frog name
              </label>
              <input
                id="setup-name"
                className="input"
                type="text"
                maxLength={24}
                value={frogName}
                onChange={(e) => setFrogName(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby="setup-error"
              />
            </span>
          </>
        )}

        {error && (
          <p id="setup-error" className="field-error setup__error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="setup__nav">
        {step > 1 && (
          <button type="button" className="btn setup__back" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < STEPS ? (
          <button type="button" className="btn btn--primary setup__next" onClick={next}>
            Next
          </button>
        ) : (
          <button type="button" className="btn btn--primary setup__next" onClick={finish}>
            Hop in
          </button>
        )}
      </div>
    </section>
  );
}
