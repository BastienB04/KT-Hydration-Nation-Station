/** About screen: version, one-liner, the fluid disclaimer and credits. */
import { PeekHeader } from "../components/PeekHeader";
import { Ribbit } from "../components/Ribbit";
import { FLUID_DISCLAIMER } from "../core/tips";
import { APP_VERSION } from "../core/version";
import { UpdatePanel } from "../components/UpdatePanel";

/** Copyright line of public/licenses/Nunito-OFL.txt. */
const NUNITO_COPYRIGHT = "Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)";

export function About() {
  return (
    <section className="screen">
      <PeekHeader title="About">
        <Ribbit pose="base" variant="peek" />
      </PeekHeader>

      <section className="card about-card" aria-labelledby="about-name">
        <h3 id="about-name" className="card__title">
          KT-Hydration-Nation-Station
        </h3>
        <p className="about-card__version">Version {APP_VERSION}</p>
        <p>A friendly frog for daily sips and hydration tracking.</p>
        <p className="about-card__note">{FLUID_DISCLAIMER}</p>
      </section>

      <UpdatePanel />

      <section className="card about-card" aria-labelledby="about-credits">
        <h3 id="about-credits" className="card__title">
          Credits
        </h3>
        <p>Ribbit and all app artwork are original drawings made for this project.</p>
        <p>
          Nunito typeface: {NUNITO_COPYRIGHT}, licensed under the SIL Open Font License 1.1. The
          licence ships with the app as licenses/Nunito-OFL.txt.
        </p>
      </section>
    </section>
  );
}
