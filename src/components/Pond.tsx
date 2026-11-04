/**
 * The pond: a water level that rises with today's progress, with the frog
 * placeholder floating on top. Phase 4 replaces the emoji with SVG frog states.
 */
import { formatMl } from "../core/format";
import { progress } from "../core/stats";

export function Pond({ total, goal, met }: { total: number; goal: number; met: boolean }) {
  const fraction = progress(total, goal);
  const percent = Math.round(fraction * 100);
  const valueText = `${formatMl(total)} of ${formatMl(goal)} ml`;

  return (
    <div className="pond-wrap">
      <div
        className="pond"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(total, goal)}
        aria-valuetext={valueText}
      >
        <div className="pond__water" style={{ height: `${percent}%` }} aria-hidden="true" />
        <div className="frog-placeholder" aria-hidden="true">
          🐸
        </div>
      </div>
      <p className="pond__readout">
        <strong>{formatMl(total)}</strong> / {formatMl(goal)} ml · {percent}%
      </p>
      {met && <p className="pond__met">Goal met. Ribbit is delighted.</p>}
    </div>
  );
}
