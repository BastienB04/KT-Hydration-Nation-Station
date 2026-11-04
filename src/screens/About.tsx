/** About screen. Version, one-liner and the fluid disclaimer. */
import { FLUID_DISCLAIMER } from "../core/tips";

export function About() {
  return (
    <section className="screen">
      <h2 className="screen__title">About</h2>
      <p className="screen__hint">
        KT-Hydration-Nation-Station 0.1.0 · a cartoon frog that reminds you to drink water.
      </p>
      <p className="tip-card__disclaimer">{FLUID_DISCLAIMER}</p>
    </section>
  );
}
