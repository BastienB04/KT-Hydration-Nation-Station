/**
 * A rotating hydration tip in Ribbit's voice, with the fluid disclaimer.
 */
import { FLUID_DISCLAIMER, tipAt } from "../core/tips";
import { useController, useData } from "../state/AppContext";

export function TipCard() {
  const controller = useController();
  const data = useData();

  return (
    <section className="tip-card">
      <p className="tip-card__text">{tipAt(data.state.tipIndex)}</p>
      <button type="button" className="btn btn--ghost btn--small" onClick={() => controller.nextTip()}>
        Another tip
      </button>
      <p className="tip-card__disclaimer">{FLUID_DISCLAIMER}</p>
    </section>
  );
}
