/**
 * A rotating hydration tip in Ribbit's voice, with the fluid disclaimer, on
 * the cream inset card.
 */
import { FLUID_DISCLAIMER, tipAt } from "../core/tips";
import { useController, useData } from "../state/AppContext";
import { Ribbit } from "./Ribbit";

export function TipCard() {
  const controller = useController();
  const data = useData();

  return (
    <section className="card card--inset tip-card">
      <Ribbit pose="base" variant="thumb" animate={false} />
      <div className="tip-card__body">
        <p className="tip-card__text">{tipAt(data.state.tipIndex)}</p>
        <button type="button" className="btn btn--ghost btn--small tip-card__next" onClick={() => controller.nextTip()}>
          Another tip
        </button>
        <p className="tip-card__disclaimer">{FLUID_DISCLAIMER}</p>
      </div>
    </section>
  );
}
