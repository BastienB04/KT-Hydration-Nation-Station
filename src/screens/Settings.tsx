/** Settings for every configurable value, plus a confirmed in-app data reset. */
import { useEffect, useRef, useState } from "react";
import {
  draftFromSettings,
  validateSettingsDraft,
  type SettingsDraft,
  type SettingsErrorKey,
} from "../core/settings";
import { useController, useData, usePlatformKind } from "../state/AppContext";

const WEEKDAYS: { iso: number; label: string }[] = [
  { iso: 1, label: "Mon" },
  { iso: 2, label: "Tue" },
  { iso: 3, label: "Wed" },
  { iso: 4, label: "Thu" },
  { iso: 5, label: "Fri" },
  { iso: 6, label: "Sat" },
  { iso: 7, label: "Sun" },
];

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
    const outcome = await controller.saveSettings(result.settings);
    setStatus(outcome.ok ? "Saved" : outcome.error);
  }

  const err = (key: SettingsErrorKey) =>
    errors[key] ? (
      <p id={`err-${key}`} className="field-error" role="alert">
        {errors[key]}
      </p>
    ) : null;

  return (
    <section className="screen">
      <h2 className="screen__title">Settings</h2>
      <form className="settings" onSubmit={onSave} noValidate>
        <div className="field">
          <label htmlFor="goal">Daily goal (ml)</label>
          <input
            id="goal"
            type="number"
            inputMode="numeric"
            value={draft.dailyGoalMl}
            onChange={(e) => setField("dailyGoalMl", e.target.value)}
            aria-invalid={errors.dailyGoalMl ? true : undefined}
            aria-describedby={errors.dailyGoalMl ? "err-dailyGoalMl" : undefined}
          />
          {err("dailyGoalMl")}
        </div>

        <fieldset className="field">
          <legend>Quick-add amounts (ml)</legend>
          <div className="settings__quick">
            {draft.quickAddMl.map((value, i) => (
              <span key={i}>
                <label htmlFor={`quick-${i}`} className="visually-hidden">
                  Quick-add {i + 1}
                </label>
                <input
                  id={`quick-${i}`}
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setQuick(i, e.target.value)}
                  aria-invalid={errors[`quickAddMl.${i}` as SettingsErrorKey] ? true : undefined}
                />
              </span>
            ))}
          </div>
          {err("quickAddMl.0")}
          {err("quickAddMl.1")}
          {err("quickAddMl.2")}
        </fieldset>

        <div className="field">
          <label htmlFor="interval">Reminder interval (min)</label>
          <input
            id="interval"
            type="number"
            inputMode="numeric"
            value={draft.reminderEveryMin}
            onChange={(e) => setField("reminderEveryMin", e.target.value)}
            aria-invalid={errors.reminderEveryMin ? true : undefined}
            aria-describedby={errors.reminderEveryMin ? "err-reminderEveryMin" : undefined}
          />
          {err("reminderEveryMin")}
        </div>

        <div className="field settings__hours">
          <span className="field__group-label">Active hours</span>
          <label htmlFor="start">Start</label>
          <input
            id="start"
            type="time"
            value={draft.activeHours.start}
            onChange={(e) => setField("activeHours", { ...draft.activeHours, start: e.target.value })}
          />
          <label htmlFor="end">End</label>
          <input
            id="end"
            type="time"
            value={draft.activeHours.end}
            onChange={(e) => setField("activeHours", { ...draft.activeHours, end: e.target.value })}
          />
          {err("activeHours")}
        </div>

        <fieldset className="field">
          <legend>Active days</legend>
          <div className="settings__days">
            {WEEKDAYS.map((day) => (
              <label key={day.iso} className="settings__day">
                <input
                  type="checkbox"
                  checked={draft.activeDays.includes(day.iso)}
                  onChange={() => toggleDay(day.iso)}
                />
                {day.label}
              </label>
            ))}
          </div>
          {err("activeDays")}
        </fieldset>

        <div className="field">
          <label htmlFor="snooze">Snooze length (min)</label>
          <input
            id="snooze"
            type="number"
            inputMode="numeric"
            value={draft.snoozeMin}
            onChange={(e) => setField("snoozeMin", e.target.value)}
            aria-invalid={errors.snoozeMin ? true : undefined}
            aria-describedby={errors.snoozeMin ? "err-snoozeMin" : undefined}
          />
          {err("snoozeMin")}
        </div>

        <label className="field field--check">
          <input
            type="checkbox"
            checked={draft.soundEnabled}
            onChange={(e) => setField("soundEnabled", e.target.checked)}
          />
          Play the ribbit sound
        </label>

        <label className="field field--check">
          <input
            type="checkbox"
            checked={draft.launchAtLogin}
            onChange={(e) => setField("launchAtLogin", e.target.checked)}
          />
          Launch at login
          {!autostartSupported && <span className="field__hint"> (desktop app only)</span>}
        </label>

        <label className="field field--check">
          <input
            type="checkbox"
            checked={draft.checkUpdates}
            onChange={(e) => setField("checkUpdates", e.target.checked)}
          />
          Check for updates
          <span className="field__hint"> (update checks arrive in a later version; your choice is saved for then)</span>
        </label>

        <div className="field">
          <label htmlFor="frogName">Frog name</label>
          <input
            id="frogName"
            type="text"
            maxLength={24}
            value={draft.frogName}
            onChange={(e) => setField("frogName", e.target.value)}
            aria-invalid={errors.frogName ? true : undefined}
            aria-describedby={errors.frogName ? "err-frogName" : undefined}
          />
          {err("frogName")}
        </div>

        <button type="submit" className="btn btn--primary">
          Save settings
        </button>
        <p className="settings__status" role="status" aria-live="polite">
          {status}
        </p>
      </form>

      <div className="settings__reset">
        {!confirmReset ? (
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
            Reset all data
          </button>
        ) : (
          <div className="confirm" role="group" aria-label="Confirm reset">
            <p>This erases every sip, your streak and your settings.</p>
            <button
              type="button"
              className="btn btn--ghost"
              ref={cancelRef}
              onClick={() => setConfirmReset(false)}
            >
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
        )}
      </div>
    </section>
  );
}
