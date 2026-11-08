import { useData, useUpdates } from "../state/AppContext";
import type { UpdatePhase } from "../app/updates";

/** The same update actions live in About and in a dismissible Pond notice. */
export function UpdatePanel({ notice = false }: { notice?: boolean }) {
  const { updates, state } = useUpdates();
  const { settings } = useData();
  if (notice && !state.notice) return null;

  const messages: Record<UpdatePhase, string> = {
    unsupported: "Automatic updates are available in the Windows x64 release.",
    idle: settings.checkUpdates
      ? "Ribbit checks on launch and every six hours while running."
      : "Automatic checks are off. You can still check here.",
    checking: "Checking for an update…",
    current: "You're up to date.",
    available: `Version ${state.version} is available.`,
    downloading: `Downloading version ${state.version}…`,
    verifying: "Verifying the download…",
    ready: `Version ${state.version} is ready to install.`,
    installing: "Saving your water history and starting the update…",
    restarting: "Restarting Ribbit…",
    restartRequired: "Update installed. Restart Ribbit to finish.",
  };
  const busy = ["checking", "downloading", "verifying", "installing", "restarting"].includes(state.phase);
  const transferring = state.phase === "downloading" || state.phase === "verifying";
  const ready = state.phase === "ready" || state.phase === "restartRequired";
  const titleId = notice ? "update-notice-title" : "update-about-title";

  return (
    <section className={`card update-card${notice ? " update-card--notice" : ""}`} aria-labelledby={titleId}>
      <h3 id={titleId} className="card__title">{notice ? "An update for Ribbit" : "Updates"}</h3>
      <p role="status">{messages[state.phase]}</p>
      {state.phase === "available" && <p className="field__hint">Download it now, then choose when to restart.</p>}
      {state.phase === "ready" && (
        <p className="field__hint">Your settings and water history will be kept. Choose Later to keep using Ribbit.</p>
      )}
      {state.error && <p className="field-error" role="alert">{state.error}</p>}
      {transferring && state.progress && (
        <div className="update-card__progress">
          <progress
            aria-label="Update download"
            max={state.progress.totalBytes ?? undefined}
            value={state.progress.totalBytes ? Math.min(state.progress.downloadedBytes, state.progress.totalBytes) : undefined}
          />
          <span className="field__hint">
            {(state.progress.downloadedBytes / 1_048_576).toFixed(1)} MB downloaded
          </span>
        </div>
      )}
      <div className="update-card__actions">
        {state.phase === "available" && (
          <button type="button" className="btn btn--primary" onClick={() => void updates.download()}>
            Download update
          </button>
        )}
        {ready && (
          <button type="button" className="btn btn--primary" onClick={() => void updates.install()}>
            Restart now
          </button>
        )}
        {(state.phase === "available" || ready) && (
          <button type="button" className="btn btn--pill" onClick={() => updates.later()}>Later</button>
        )}
        {!notice && !ready && state.phase !== "unsupported" && (
          <button type="button" className="btn" disabled={busy} onClick={() => void updates.check()}>
            Check for updates
          </button>
        )}
      </div>
      {!notice && state.phase !== "unsupported" && (
        <p className="field__hint">
          {settings.checkUpdates ? "Automatic checks are on." : "Automatic checks are off."}
          {" "}Change this in Settings. Updates install only when you choose Restart now.
        </p>
      )}
    </section>
  );
}
