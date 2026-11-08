/**
 * Settings in three grouped cards (Goal, Reminders, Ribbit & app), plus a
 * confirmed in-app data reset. Visible labels are short; visually hidden text
 * completes each accessible name. Theme applies the moment it is picked
 * (controller.setTheme); the form's Save never changes it.
 */
import { useEffect, useRef, useState } from "react";
import { PeekHeader } from "../components/PeekHeader";
import { Ribbit } from "../components/Ribbit";
import { THEME_MODES, type ThemeMode } from "../core/schema";
import {
  draftFromSettings,
  validateSettingsDraft,
  type SettingsDraft,
  type SettingsErrorKey,
} from "../core/settings";
import { useController, useData, usePlatformKind } from "../state/AppContext";

const WEEKDAYS: { iso: number; name: string }[] = [
  { iso: 1, name: "Monday" },
  { iso: 2, name: "Tuesday" },
  { iso: 3, name: "Wednesday" },
  { iso: 4, name: "Thursday" },
  { iso: 5, name: "Friday" },
  { iso: 6, name: "Saturday" },
  { iso: 7, name: "Sunday" },
];

const THEME_LABELS: Record<ThemeMode, string> = { system: "System", light: "Light", dark: "Dark" };

export function Settings() {
  const controller = useController();
  const data = useData();
  const platformKind = usePlatformKind();
  const autostartSupported = platformKind === "tauri";

  const [draft, setDraft] = useState<SettingsDraft>(() => draftFromSettings(data.settings));
  const [errors, setErrors] = useState<Partial<Record<SettingsErrorKey, string>>>({});
  const [status, setStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmReset) cancelRef.current?.focus();
  }, [confirmReset]);

  function setField<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setQuick(i: number, value: string) {
    setDraft((d) => {
      const next = [...d.quickAddMl] as [string, string, string];
      next[i] = value;
      return { ...d, quickAddMl: next };
    });
  }

  function toggleDay(iso: number) {
    setDraft((d) => ({
      ...d,
      activeDays: d.activeDays.includes(iso)
        ? d.activeDays.filter((x) => x !== iso)
        : [...d.activeDays, iso],
    }));
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    const result = validateSettingsDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      setStatus("");
      return;
    }
    setErrors({});
    // The draft has no theme; saveSettings keeps the stored one (only setTheme changes it).
    const outcome = await controller.saveSettings(result.settings);
    setStatus(outcome.ok ? "Saved" : outcome.error);
  }

  const err = (key: SettingsErrorKey) =>
    errors[key] ? (
      <p id={`err-${key}`} className="field-error setting-row__error" role="alert">
        {errors[key]}
      </p>
    ) : null;

  const invalid = (key: SettingsErrorKey) => (errors[key] ? true : undefined);
  const describedBy = (key: SettingsErrorKey) => (errors[key] ? `err-${key}` : undefined);

  return (
    <section className="screen">
      <PeekHeader title="Settings">
        <Ribbit pose="sleeping" variant="peek" />
      </PeekHeader>

      <form className="settings" onSubmit={onSave} noValidate>
        <section className="card settings-card" aria-labelledby="settings-goal">
          <h3 id="settings-goal" className="card__title">
            Goal
          </h3>
          <div className="setting-row">
            <label htmlFor="goal">Daily goal (ml)</label>
            <input
              id="goal"
              className="input setting-row__input"
              type="number"
              inputMode="numeric"
              value={draft.dailyGoalMl}
              onChange={(e) => setField("dailyGoalMl", e.target.value)}
              aria-invalid={invalid("dailyGoalMl")}
              aria-describedby={describedBy("dailyGoalMl")}
            />
            {err("dailyGoalMl")}
          </div>
          <div className="setting-row" role="group" aria-labelledby="quick-label">
            <span id="quick-label">
              Quick-add<span className="visually-hidden"> amounts</span> (ml)
            </span>
            <span className="setting-row__controls">
              {draft.quickAddMl.map((value, i) => (
                <span key={i}>
                  <label htmlFor={`quick-${i}`} className="visually-hidden">
                    Quick-add {i + 1}
                  </label>
                  <input
                    id={`quick-${i}`}
                    className="input setting-row__input setting-row__input--quick"
                    type="number"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => setQuick(i, e.target.value)}
                    aria-invalid={invalid(`quickAddMl.${i}` as SettingsErrorKey)}
                    aria-describedby={describedBy(`quickAddMl.${i}` as SettingsErrorKey)}
                  />
                </span>
              ))}
            </span>
            {err("quickAddMl.0")}
            {err("quickAddMl.1")}
            {err("quickAddMl.2")}
          </div>
        </section>

        <section className="card settings-card" aria-labelledby="settings-reminders">
          <h3 id="settings-reminders" className="card__title">
            Reminders
          </h3>
          <div className="setting-row">
            <label htmlFor="interval">
              Every (min)<span className="visually-hidden">, reminder interval</span>
            </label>
            <input
              id="interval"
              className="input setting-row__input setting-row__input--short"
              type="number"
              inputMode="numeric"
              value={draft.reminderEveryMin}
              onChange={(e) => setField("reminderEveryMin", e.target.value)}
              aria-invalid={invalid("reminderEveryMin")}
              aria-describedby={describedBy("reminderEveryMin")}
            />
            {err("reminderEveryMin")}
          </div>
          <div className="setting-row" role="group" aria-labelledby="hours-label">
            <span id="hours-label">Active hours</span>
            <span className="setting-row__controls">
              <label htmlFor="start" className="visually-hidden">
                Start
              </label>
              <input
                id="start"
                className="input setting-row__input setting-row__input--time"
                type="time"
                value={draft.activeHours.start}
                onChange={(e) => setField("activeHours", { ...draft.activeHours, start: e.target.value })}
                aria-invalid={invalid("activeHours")}
                aria-describedby={describedBy("activeHours")}
              />
              <span className="setting-row__to" aria-hidden="true">
                to
              </span>
              <label htmlFor="end" className="visually-hidden">
                End
              </label>
              <input
                id="end"
                className="input setting-row__input setting-row__input--time"
                type="time"
                value={draft.activeHours.end}
                onChange={(e) => setField("activeHours", { ...draft.activeHours, end: e.target.value })}
                aria-invalid={invalid("activeHours")}
                aria-describedby={describedBy("activeHours")}
              />
            </span>
            {err("activeHours")}
          </div>
          <div className="setting-row" role="group" aria-labelledby="days-label">
            <span id="days-label">Active days</span>
            <span className="setting-row__controls day-chips">
              {WEEKDAYS.map((day) => (
                <label key={day.iso} className="day-chip">
                  <input
                    type="checkbox"
                    aria-label={day.name}
                    checked={draft.activeDays.includes(day.iso)}
                    onChange={() => toggleDay(day.iso)}
                    aria-describedby={describedBy("activeDays")}
                  />
                  <span aria-hidden="true">{day.name[0]}</span>
                </label>
              ))}
            </span>
            {err("activeDays")}
          </div>
          <div className="setting-row">
            <label htmlFor="snooze">
              Snooze (min)<span className="visually-hidden">, snooze length</span>
            </label>
            <input
              id="snooze"
              className="input setting-row__input setting-row__input--short"
              type="number"
              inputMode="numeric"
              value={draft.snoozeMin}
              onChange={(e) => setField("snoozeMin", e.target.value)}
              aria-invalid={invalid("snoozeMin")}
              aria-describedby={describedBy("snoozeMin")}
            />
            {err("snoozeMin")}
          </div>
        </section>

        <section className="card settings-card" aria-labelledby="settings-app">
          <h3 id="settings-app" className="card__title">
            Ribbit &amp; app
          </h3>
          <div className="setting-row">
            <label htmlFor="sound">
              <span className="visually-hidden">Play the </span>Ribbit sound
            </label>
            <input
              id="sound"
              className="switch"
              type="checkbox"
              role="switch"
              checked={draft.soundEnabled}
              onChange={(e) => setField("soundEnabled", e.target.checked)}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="login" className="setting-row__label">
              Launch at login
              {!autostartSupported && <span className="field__hint"> (desktop app only)</span>}
            </label>
            <input
              id="login"
              className="switch"
              type="checkbox"
              role="switch"
              checked={draft.launchAtLogin}
              onChange={(e) => setField("launchAtLogin", e.target.checked)}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="updates" className="setting-row__label">
              Check for updates
              <span className="field__hint setting-row__hint">
                {" "}
            Check on launch and every six hours in the Windows app. Updates install when you choose.
              </span>
            </label>
            <input
              id="updates"
              className="switch"
              type="checkbox"
              role="switch"
              checked={draft.checkUpdates}
              onChange={(e) => setField("checkUpdates", e.target.checked)}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="frogName">Frog name</label>
            <input
              id="frogName"
              className="input setting-row__input setting-row__input--name"
              type="text"
              maxLength={24}
              value={draft.frogName}
              onChange={(e) => setField("frogName", e.target.value)}
              aria-invalid={invalid("frogName")}
              aria-describedby={describedBy("frogName")}
            />
            {err("frogName")}
          </div>
          <fieldset className="setting-row theme-field" aria-describedby="theme-hint">
            <legend className="visually-hidden">Theme</legend>
            <span aria-hidden="true">Theme</span>
            <span className="segmented">
              {THEME_MODES.map((mode) => (
                <label key={mode} className="segmented__option">
                  <input
                    type="radio"
                    name="theme"
                    value={mode}
                    checked={data.settings.theme === mode}
                    onChange={() => controller.setTheme(mode)}
                  />
                  <span>{THEME_LABELS[mode]}</span>
                </label>
              ))}
            </span>
            <p id="theme-hint" className="field__hint setting-row__hint">
              Applies right away. System follows your Windows or macOS setting.
            </p>
          </fieldset>
        </section>

        <div className="settings__footer">
          <button type="submit" className="btn btn--primary settings__save">
            Save settings
          </button>
          {!confirmReset && (
            <button type="button" className="btn btn--danger settings__reset" onClick={() => setConfirmReset(true)}>
              Reset all data
            </button>
          )}
        </div>
        <p className="settings__status" role="status" aria-live="polite">
          {status}
        </p>
      </form>

      {confirmReset && (
        <div className="card confirm" role="group" aria-label="Confirm reset">
          <p>This erases every sip, your streak and your settings.</p>
          <div className="confirm__actions">
            <button type="button" className="btn" ref={cancelRef} onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                controller.reset();
              }}
            >
              Erase everything
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
