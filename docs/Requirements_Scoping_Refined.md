# KT-Hydration-Nation-Station: Refined Requirements, Technical Design and Implementation Plan

| | |
|---|---|
| Source | `Requirements_Scoping.md` (4 Nov 2026) and the planning session of 21 Sep 2026 |
| Status | Draft for your review. Items marked **DECIDE** need your answer before coding starts. |
| Target | A Windows desktop app (.exe installer) that reminds the user to drink water, themed around a cartoon frog |
| Dev machine | This Mac (Apple silicon, macOS 26.7.1), verified 4 Nov 2026: Node 22.23.2, npm 10.9.8, Rust 1.98 / rustup 1.29.1, Xcode Command Line Tools, git 2.54, Homebrew 6.0.21, 36 GB RAM, 190 GB free. No VM software and no `gh` CLI installed yet. |

---

## 1. Summary

You develop on the Mac, push the code to a GitHub repository, and a free GitHub Actions Windows runner builds a signed-for-updates installer (`KT-Hydration-Nation-Station_x.y.z_x64-setup.exe`) and publishes it as a GitHub Release. The Windows laptop downloads that one file from the README link, installs it with one SmartScreen click-through, and from then on the app updates itself from GitHub Releases. Day-to-day UI work is checked on the Mac (browser and `tauri dev`); Windows-only behaviour (toasts, tray, autostart, installer) is checked in a free Windows 11 virtual machine on the Mac before each release.

Stack: **Tauri v2** (Rust core + web UI in React/TypeScript), chosen in the September session for its ~10 MB installer and ~40 MB idle RAM, which suits an app that lives in the tray all day. All tooling is free; the only "cost" is one SmartScreen warning at install time because we don't buy a code-signing certificate (recurring fee, excluded by your constraints).

---

## 2. Decisions needed before coding (**DECIDE**)

| # | Question | Recommendation | Why it matters |
|---|---|---|---|
| D1 | **App name and identifier.** Shortlist: KT-Hydration-Nation-Station, Ribbit Reminder, Sip & Hop, Froggy Sips, Pond. | `KT-Hydration-Nation-Station`, identifier `com.bastienb04.kt-hydration-nation-station` | The identifier names the data folder (`%APPDATA%\com.bastienb04.kt-hydration-nation-station`) and the installed app identity. Changing it after the first release breaks auto-update continuity (users would have two apps). Decide once. Avoid trademarked names (Kermit, Pepe). |
| D2 | **Where the code lives.** | Make this workspace (`~/Documents/Kiro-galo`) the git repo root: Tauri project at the root, these two `.md` files moved to `docs/`. | Tauri at the repo root means `tauri-action` needs no `projectPath`. One repo, one README, one Releases page. |
| D3 | **GitHub account and repo visibility.** | Personal github.com account (free), **public** repo. Set a per-repo git identity (`git config user.email <personal>`) because the global identity on this Mac is your Amazon email. | Release assets of a *private* repo need a GitHub login to download, and the auto-updater would need an embedded token. Public also gives unlimited Actions minutes and access to the `windows-11-arm` runner. Nothing sensitive goes in this repo. |
| D4 | **Is the Windows laptop personal or Amazon-managed?** (open since September) | Confirm it is personal. | Managed laptops typically block unsigned installers by policy. If managed, the fallback is the same UI shipped as a web app (PWA) on GitHub Pages: browser notifications work, but tray and launch-at-login are lost. |
| D5 | **Policy check for a personal project on a work Mac.** | Spend five minutes confirming that building a personal, non-Amazon side project on this managed Mac and pushing it to a personal GitHub account is allowed under your employment/IP policy. | Cheaper to confirm now than to move the repo later. |
| D6 | **Windows test VM.** | UTM (free, open source) with Windows 11 ARM. Alternative: VMware Fusion, free for everyone since 11 Nov 2024. Parallels is a subscription and excluded. | Needed for Phase 5. A Windows 11 ISO for Apple silicon is downloadable from Microsoft directly or via the free CrystalFetch app; unactivated Windows works for testing (watermark, personalization locked). |
| D7 | **UI framework.** | React + TypeScript (Vite), the `create-tauri-app` template. Svelte is the lighter alternative. | Largest ecosystem and most Tauri examples; the app is small so either works. |
| D8 | **Frog's name and voice.** | "Ribbit". Tips written in a playful, short, pun-light voice. | Appears in copy, tray tooltip and notifications. |

**Decision log (4 Nov 2026)**: D1 name `KT-Hydration-Nation-Station`, identifier `com.bastienb04.kt-hydration-nation-station`, npm/cargo package `kt-hydration-nation-station`. D2 this workspace is the repo root, docs in `docs/`. D3 GitHub `BastienB04`, public repo `KT-Hydration-Nation-Station`; commits use the GitHub no-reply address `106097477+BastienB04@users.noreply.github.com`. D4 laptop is personal. D5 cleared (learning project, unrelated to work). D6 UTM + Windows 11 ARM. D7 React + TypeScript (Vite), no router/state/CSS libraries. D8 frog is **Ribbit**; playful, short, pun-light voice. Updater and process plugins are added in Phase 6 (they need the signing key), not Phase 2.

---

## 3. Refined requirements

### 3.1 Goals and non-goals

Goals
- Make the user drink water regularly during their active hours, with a gentle, fun reminder that is hard to ignore but easy to act on.
- Let the user log intake in two clicks and see progress for today and the last week.
- Be free to build, free to ship, free to run, and update itself.

Non-goals (v1)
- No accounts, cloud sync, mobile version, or data sharing. Everything is local.
- No weather, fitness-tracker or calendar integrations.
- No paid code signing, no Microsoft Store listing (can be added later; individual Store registration is free since Sep 2025).

### 3.2 Users and devices

| | |
|---|---|
| Users | You and one other person (the laptop owner). Non-technical install path required. |
| Target OS | Windows 11 x64 (primary) and Windows 10 x64 21H2 or newer. WebView2 runtime is preinstalled on Windows 11 and on updated Windows 10; the installer downloads it if missing (~0 MB added to installer, needs internet once). |
| Dev OS | macOS on Apple silicon (this Mac). |
| Test OS | Windows 11 ARM in a VM on the Mac, then the real laptop. |

### 3.3 Functional requirements (MoSCoW)

| ID | Requirement | Priority |
|---|---|---|
| F-01 | **Home screen** shows today's intake vs daily goal (ml), as a pond water level behind the frog mascot plus the numbers. | Must |
| F-02 | **Quick-add** buttons (default 150 / 250 / 500 ml, configurable) and a custom amount field. Each tap logs an entry with a timestamp. | Must |
| F-03 | **Undo** the last entry; **edit/delete** any of today's entries from a list. | Must / Should |
| F-04 | **History**: last 7 days as bars with the goal line; current **streak** (consecutive days meeting the goal). | Must |
| F-05 | **Reminders**: every N minutes (default 60) inside active hours (default 08:00–22:00) on selected weekdays. No reminder once today's goal is met. | Must |
| F-06 | Reminder is a **Windows toast notification** with a frog line and a tip; optional **ribbit sound**. | Must |
| F-07 | **Snooze** (default 10 min) and **Pause** (30 min / 1 h / 2 h / rest of day, "in a meeting"). | Must |
| F-08 | **Tips**: a rotating tip card on the home screen (bundled JSON, ~50 tips, no server), and one tip attached to each reminder. | Must |
| F-09 | **Tray icon** with tooltip "KT-Hydration-Nation-Station · 1,250 / 2,000 ml · next 14:30" and menu: Open, Log 250 ml, Pause 1 h, Quit. Left-click opens the window. | Must |
| F-10 | Closing the window **hides to tray**; the app keeps running. Quit only from the tray menu. | Must |
| F-11 | **Launch at login** (toggle, default on), starting minimized to tray. | Must |
| F-12 | **Settings**: goal, quick-add sizes, interval, active hours/days, sound on/off, launch at login, snooze length, frog name, reset data. | Must |
| F-13 | **First-run setup**: 3 short steps (goal, active hours, name your frog) then straight to home. | Should |
| F-14 | **Single instance**: launching the app again focuses the running window instead of opening a second copy. | Must |
| F-15 | **Auto-update**: on launch (and every 6 h while running) check GitHub Releases; if newer, download, verify signature, install and offer "Restart now / later". | Must |
| F-16 | **Export** intake history as CSV. | Could |
| F-17 | **Keyboard shortcut** (global hotkey) to log the default amount without opening the window. | Could |
| F-18 | **In-app reminder popup**: a small always-on-top window with the frog and quick-add buttons, shown at reminder time as a complement to the toast. | Could (v1.1) |

### 3.4 Theme: cartoon frog (visual and audio spec)

- **Mascot**: a round, friendly cartoon frog (named Ribbit) drawn as inline SVG in the repo so there are no licence questions. It has five states driven by today's progress:

  | Progress | State | Look |
  |---|---|---|
  | 0–24 % | Parched | Droopy eyes, pale green, tiny puddle, occasional sigh animation |
  | 25–49 % | Waking up | Neutral face, slightly brighter |
  | 50–74 % | Content | Smile, blinking, sits in shallow water |
  | 75–99 % | Happy | Big smile, sits on a lily pad, bobbing |
  | 100 % | Hydrated | Party hat or crown, sparkles, one celebratory "ribbit", flies buzz past as the reward |

- **Progress** is the pond water level behind the frog (SVG mask animated with CSS), plus "1,250 / 2,000 ml".
- **Streak** is a row of lily pads, one per day; a day that met the goal gets a flower.
- **Palette** (light / dark "night pond" following the Windows theme): Lily Green `#6BBF59`, Deep Pond `#1F6F5B`, Pond Blue `#4FA3D1`, Sunny Cream `#FFF7D6` (light background), Dark Pond `#0F2E2A` (dark background), Blush `#F7A7B8` (cheeks), Fly Black `#2B2B2B`.
- **Type**: a rounded sans such as Nunito or Baloo 2 (SIL OFL), bundled locally. No CDN fonts, so the app works offline and the CSP stays strict.
- **Sound**: a short "ribbit" on reminders and goal completion, a soft "plop" on logging. Either CC0 clips (freesound.org) or synthesized with the Web Audio API (no asset at all). Windows toasts always play the system sound; the ribbit is played by the app itself, which is fine because the app is alive in the tray.
- **Copy voice**: short and playful. "Ribbit. Time for a sip." "250 ml from a happy frog." "Frogs drink through their skin. You'll have to use a glass."
- **Icons**: app icon and tray icon generated from one 1024×1024 frog PNG with `npm run tauri icon` (produces all `.ico`/`.png` sizes). Tray icon needs a simple high-contrast silhouette to read at 16×16.
- Fallback art if hand-drawn SVG takes too long: OpenMoji frog (CC BY-SA 4.0) or Twemoji (CC BY 4.0), with attribution in the About screen.

### 3.5 "Make it cool" backlog (effort S/M/L; v1 items marked)

| Idea | Effort | Note |
|---|---|---|
| Evolving mascot states (3.4) | S | **v1** |
| Lily-pad streak garden | M | **v1** (simple version) |
| Celebration on goal (sparkles, flies, ribbit) | S | **v1** |
| Dark "night pond" theme following Windows | S | **v1** |
| End-of-day summary toast ("1.9 L today, 3-day streak") | S | v1.1 |
| In-app reminder popup window with quick-add (F-18) | M | v1.1 |
| Global hotkey to log (F-17, `global-shortcut` plugin) | S | v1.1 |
| Weekly stats page + CSV export (F-16) | M | v1.1 |
| Unlockable hats/accessories for streak milestones | M | later |
| "Frog facts" tip mode (toggle between hydration tips and frog trivia) | S | later |
| Sound packs (classic ribbit, tiny tree frog, bullfrog) | S | later |
| Weather-adjusted goal | L | needs network and an API; skip |

### 3.6 Non-functional requirements

| ID | Requirement |
|---|---|
| N-01 | Installer ≤ 15 MB; idle RAM ≤ 80 MB; cold start ≤ 2 s on the laptop. |
| N-02 | Works fully offline. The only network call is the update check to `github.com`, and it can be disabled in Settings. |
| N-03 | No telemetry, no accounts, no remote content. Data lives in `%APPDATA%\<identifier>\store.json` and survives updates. |
| N-04 | Reminders keep working while the window is hidden, after the laptop sleeps and wakes, and after a reboot (via launch at login). No burst of catch-up reminders after sleep: at most one. |
| N-05 | Per-user install (no admin rights), uninstall from Windows Settings like any app. |
| N-06 | Updates are signature-verified (Tauri updater, minisign keys); the private key never enters the repo. |
| N-07 | Strict Content-Security-Policy; frontend only talks to the Rust core through allow-listed Tauri commands/plugins (capabilities file). |
| N-08 | Supports Windows display scaling 100–200 % and both light and dark Windows themes. |

### 3.7 Distribution and install requirements

- **Developer flow**: commit on the Mac → `git push` → tag `vX.Y.Z` → GitHub Actions builds on `windows-latest` → GitHub Release with `KT-Hydration-Nation-Station_X.Y.Z_x64-setup.exe`, its `.sig`, and `latest.json`.
- **End-user flow** (README "Install" section, written for a non-developer):
  1. Open the repo's Releases page (or the permalink in the README) and download the `-setup.exe`.
  2. Edge may ask to "Keep" the download; Windows SmartScreen shows "Windows protected your PC" → **More info** → **Run anyway**. This appears once, because the installer is not code-signed.
  3. The installer runs per-user and finishes in seconds; the app opens to the first-run setup.
  4. Updates are automatic from then on; no SmartScreen prompt for updates installed by the app.
- **Build from source** (fallback section in the README for the curious): install Rust (rustup), Visual Studio Build Tools with "Desktop development with C++", Node LTS; `git clone`, `npm install`, `npm run tauri dev` or `npm run tauri build`. Not the primary path.
- Later options, in order of ease, if the app outgrows two users: a one-page download site on GitHub Pages; winget manifest (`winget install`); Microsoft Store (free individual account, removes SmartScreen, Store handles updates). All free.

### 3.8 Acceptance criteria (v1 definition of done)

Verified in the Windows VM and then on the real laptop:

1. Fresh install from the Release link succeeds with only the SmartScreen click-through; the app opens to first-run setup.
2. Logging 250 ml updates the pond level, the numbers, the frog state and the tray tooltip within one second; undo removes it; data persists across app restart and laptop reboot.
3. With interval set to 1 minute and the window hidden to tray, a toast with a tip appears within the interval; the ribbit plays when sound is on; no toast arrives once the goal is met, outside active hours, or while paused/snoozed.
4. Put the VM to sleep for 10 minutes past a due reminder and wake it: exactly one reminder fires.
5. Closing the window hides it; left-clicking the tray icon restores it; "Quit" exits; relaunching while running focuses the existing window.
6. "Launch at login" on → sign out/in → the app is in the tray without a window.
7. Release v0.1.1 with a visible change → the installed v0.1.0 offers the update on launch, installs it, and the data is intact.
8. Light and dark Windows themes both render correctly at 100 % and 150 % scaling.
9. Uninstall from Windows Settings removes the app (data folder removal is a checkbox in the uninstaller).

---

## 4. Technical design

### 4.1 Stack and versions

| Layer | Choice | Notes |
|---|---|---|
| Shell | Tauri 2.x (Rust crate `tauri` with `tray-icon` and `image-png` features) | Plugins need Rust ≥ 1.90; Mac has 1.98. |
| UI | React 18 + TypeScript + Vite | From `npm create tauri-app@latest`. |
| Styling | Plain CSS with custom properties (design tokens) + CSS animations; `framer-motion` optional for the mascot | Keep dependencies small. |
| State | React `useReducer` + a small store module; persisted through `@tauri-apps/plugin-store` | No Redux. |
| Persistence | `tauri-plugin-store` (`store.json`), auto-save debounced | Switch to `tauri-plugin-sql` (SQLite) only if history grows beyond a few years of entries. It won't. |
| Notifications | `tauri-plugin-notification` (Windows toasts via WinRT) | Only works from an *installed* app; in `tauri dev` on Windows it shows the PowerShell name/icon (documented plugin caveat). |
| Autostart | `tauri-plugin-autostart` (HKCU `Run` key on Windows), launched with `--minimized` | |
| Updater | `tauri-plugin-updater` + `tauri-plugin-process` (relaunch) | Static `latest.json` on GitHub Releases. |
| Single instance | `tauri-plugin-single-instance` (register first in the builder) | No JS API, no capability needed. |
| Links | `tauri-plugin-opener` for "Open Releases page" / About links | |
| Build/release | GitHub Actions `windows-latest` + `tauri-apps/tauri-action@v1` | Cross-compiling Windows installers on macOS is possible with `cargo-xwin`/NSIS but Tauri's docs call it a last resort; we don't need it. |
| Windows test | UTM or VMware Fusion (both free) with Windows 11 ARM | Installs the CI-built x64 installer under Windows 11's x64 emulation; the WebView2 bootstrapper installs the ARM64 runtime automatically. Fallback: build an ARM64 installer on GitHub's free `windows-11-arm` runner (public repos only) with `--target aarch64-pc-windows-msvc`. |

### 4.2 Architecture

```
┌──────────────────────────── KT-Hydration-Nation-Station.exe ────────────────────────────┐
│  Rust core (src-tauri)                                                 │
│   • single-instance → focus main window                                │
│   • tray icon + menu (Open / Log 250 / Pause 1h / Quit)                │
│   • ticker thread: emits "tick" event every 30 s (not throttled)       │
│   • plugins: notification, autostart, store, updater, process, opener  │
│   • commands: set_tray_tooltip(text), set_tray_icon(state)             │
│                        ▲ events / invoke ▼                              │
│  WebView2 (React/TS)                                                   │
│   • screens: Setup, Home, History, Settings, About                     │
│   • scheduler.evaluate() on every tick, on wake, on settings change    │
│   • persistence via plugin-store (store.json)                          │
│   • notifications via plugin-notification; ribbit via Web Audio        │
│   • updater check on launch + every 6 h                                │
└────────────────────────────────────────────────────────────────────────┘
          %APPDATA%\com.bastienb04.kt-hydration-nation-station\store.json      github.com/BastienB04/KT-Hydration-Nation-Station/releases
```

Why the clock lives in Rust: WebView2 throttles JavaScript timers in hidden windows (Chromium background throttling), so a `setInterval` in the UI could drift once the window has been in the tray for a while. A Rust thread sleeping 30 s and emitting an event is ~10 lines, never throttled, and keeps all the business logic in TypeScript where it's easiest to iterate. The frontend logic is timestamp-based (see 4.5), so the tick rate only affects latency, never correctness.

### 4.3 Project structure

```
Kiro-galo/                         (git repo root, D2)
├─ .github/workflows/
│  ├─ build-check.yml              build on push, upload installer as workflow artifact (for VM tests)
│  └─ release.yml                  on tag v*, build + GitHub Release + latest.json
├─ docs/
│  ├─ Requirements_Scoping.md
│  └─ Requirements_Scoping_Refined.md
├─ public/                         fonts, sounds (ribbit.ogg, plop.ogg)
├─ src/                            React app
│  ├─ app/        App.tsx, router (Setup/Home/History/Settings/About)
│  ├─ components/ Frog.tsx (SVG states), Pond.tsx, QuickAdd.tsx, LilyPadStreak.tsx, TipCard.tsx, HistoryBars.tsx
│  ├─ core/       scheduler.ts, store.ts (schema + load/save), stats.ts (totals, streak), notify.ts, sound.ts, updater.ts, tray.ts
│  ├─ data/       tips.json
│  └─ styles/     tokens.css (palette, radii, motion), base.css
├─ src-tauri/
│  ├─ src/lib.rs                   builder, plugins, tray, ticker, commands
│  ├─ src/main.rs
│  ├─ capabilities/default.json    permissions allow-list
│  ├─ icons/                       generated by `tauri icon`
│  ├─ tauri.conf.json
│  └─ Cargo.toml
├─ README.md                       install instructions (3.7), screenshots, build from source
├─ package.json
└─ .gitignore                      node_modules, dist, src-tauri/target, *.key, .env
```

### 4.4 Data model (`store.json`)

```jsonc
{
  "schemaVersion": 1,
  "settings": {
    "dailyGoalMl": 2000,
    "quickAddMl": [150, 250, 500],
    "reminderEveryMin": 60,
    "activeHours": { "start": "08:00", "end": "22:00" },
    "activeDays": [1, 2, 3, 4, 5, 6, 7],       // ISO weekday, 1 = Monday
    "snoozeMin": 10,
    "soundEnabled": true,
    "launchAtLogin": true,
    "checkUpdates": true,
    "frogName": "Ribbit",
    "setupDone": false
  },
  "state": {
    "lastReminderAt": null,                     // ISO 8601 UTC
    "lastDrinkAt": null,
    "pausedUntil": null,
    "tipIndex": 0,
    "lastCelebratedDate": null
  },
  "log": {
    "2026-11-04": [ { "t": "2026-11-04T08:12:31Z", "ml": 250 } ]
  }
}
```

- Dates in `log` are local calendar days (so a 23:30 drink belongs to that day); timestamps are UTC.
- `todayTotal = sum(log[today].ml)`; `streak` = consecutive days ending yesterday (plus today if met) where total ≥ goal at the time (we store the goal per day only if it changes; v1 uses the current goal).
- `schemaVersion` enables migrations later. Load is defensive: missing keys get defaults.
- Writes are debounced by the store plugin; call `save()` explicitly after each log entry so a crash loses nothing.

### 4.5 Reminder scheduling (runs in TypeScript on each tick, on window focus, on settings change)

```
evaluate(now):
  if settings.setupDone == false                        → return
  if state.pausedUntil && now < pausedUntil             → return
  if weekday(now) ∉ activeDays or now ∉ [start, end)   → return
  if todayTotal >= dailyGoalMl                          → celebrateOnce(); return
  anchor = max(lastDrinkAt, lastReminderAt, todayActiveStart)
  if now − anchor >= reminderEveryMin                   → fire(now)

fire(now):
  tip = nextTip()
  sendNotification({ title: "<frogName> says: time for a sip 🐸", body: tip })
  if soundEnabled: playRibbit()
  state.lastReminderAt = now; save()
  updateTray(tooltip, iconState)

snooze():  state.pausedUntil = now + snoozeMin
pause(d):  state.pausedUntil = now + d   (or end of active hours for "rest of day")
log(ml):   push entry; state.lastDrinkAt = now; save(); updateTray(); maybe celebrate
```

Because every decision compares timestamps, a laptop that sleeps through three due reminders fires exactly one on wake (N-04). A 30 s tick gives ≤ 30 s latency on a minute-granular schedule.

### 4.6 Notifications: what to expect on Windows

- The plugin posts standard Windows toasts (Action Center, Focus Assist rules apply). Clicking a toast activates the app via its Start Menu shortcut; whether it reliably brings the hidden window forward must be **verified in the VM**. If it doesn't, F-18 (in-app popup window) is the fix, and the tray icon tooltip always shows "reminder due".
- Toasts only render correctly from the installed app, so toast testing happens in the VM with a CI-built installer, not in `tauri dev`.
- Permission: on desktop `isPermissionGranted()` is normally true; keep the request flow anyway (code sample in the plugin docs).

### 4.7 Window and tray behaviour

- Main window 420×720, min 360×600, resizable, remembers position (`window-state` plugin, optional).
- `onCloseRequested` → `preventDefault()` + `hide()` (F-10).
- Launched with `--minimized` (by autostart) → window not shown; otherwise shown.
- Tray built in Rust (more robust than JS for a long-running icon): left-click shows/focuses the window; right-click shows the menu. Two Tauri commands let the frontend update the tooltip and swap the icon between "ok" and "due" states.

Rust sketch (`src-tauri/src/lib.rs`, to be finalised when scaffolding):

```rust
use std::{thread, time::Duration};
use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

pub fn run() {
    tauri::Builder::default()
        // register single-instance first
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // tray
            let open = MenuItem::with_id(app, "open", "Open KT-Hydration-Nation-Station", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("KT-Hydration-Nation-Station")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "open" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            // start hidden when launched by autostart
            if std::env::args().any(|a| a == "--minimized") {
                if let Some(w) = app.get_webview_window("main") { let _ = w.hide(); }
            }

            // 30-second ticker, never throttled
            let handle = app.handle().clone();
            thread::spawn(move || loop {
                thread::sleep(Duration::from_secs(30));
                let _ = handle.emit("tick", ());
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_tray_tooltip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_main(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.unminimize(); let _ = w.set_focus(); }
}

#[tauri::command]
fn set_tray_tooltip(app: tauri::AppHandle, text: String) {
    if let Some(t) = app.tray_by_id("main") { let _ = t.set_tooltip(Some(text)); }
}
```

Frontend side:

```ts
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

await listen('tick', () => scheduler.evaluate(Date.now()));
const win = getCurrentWindow();
await win.onCloseRequested(async (e) => { e.preventDefault(); await win.hide(); });
```

### 4.8 Key configuration

`src-tauri/tauri.conf.json` (essentials):

```jsonc
{
  "productName": "KT-Hydration-Nation-Station",
  "version": "0.1.0",
  "identifier": "com.bastienb04.kt-hydration-nation-station",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{ "label": "main", "title": "KT-Hydration-Nation-Station", "width": 420, "height": 720, "minWidth": 360, "minHeight": 600, "center": true, "visible": false }],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self' ipc: http://ipc.localhost; media-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],                       // one artifact for users; add "msi" only if asked
    "createUpdaterArtifacts": false,
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"],
    "windows": {
      "webviewInstallMode": { "type": "downloadBootstrapper" },
      "nsis": { "installMode": "currentUser" }
    }
  },
  "plugins": {
    "updater": {
      "pubkey": "<contents of ~/.tauri/kt-hns.key.pub>",
      "endpoints": ["https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/latest/download/latest.json"],
      "requireSignedVersion": true,
      "allowDowngrades": false,
      "windows": { "installMode": "passive" }
    }
  }
}
```

The public key is configured only after separately approved signing-key setup. Ordinary builds retain `createUpdaterArtifacts: false`; the release workflow adds `tauri.release.conf.json` to enable signed artifacts. HTTPS updater requests run in Rust, outside the webview CSP. The native update check enforces HTTPS, including artifact redirects, and accepts only the matching installer URL in this repository.

`src-tauri/capabilities/default.json` retains the existing main-window permissions. Autostart permissions remain in their separate capability. Do not use broad updater/process defaults: they would allow a stock check to bypass the guarded native check.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "core:window:allow-unminimize",
    "opener:default",
    "notification:default",
    "store:default"
  ]
}
```

`src-tauri/capabilities/updates.json` grants only these actions to the main Windows window:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "windows-updates",
  "windows": ["main"],
  "platforms": ["windows"],
  "permissions": ["updater:allow-download", "updater:allow-install", "process:allow-restart"]
}
```

`src-tauri/Cargo.toml`: `tauri = { version = "2", features = ["tray-icon", "image-png"] }` plus the plugin crates. Phase 6 updater/process versions are pinned to 2.14.1 / 2.4.0 in both Rust and npm; they require Rust 1.90+ and Tauri 2.12.

Versioning: `tauri.conf.json`, `package.json`, npm lockfile, Cargo manifest and Cargo lockfile must agree. The release gate also requires an exact `v<version>` tag. About reads the package version rather than a hard-coded string.

### 4.9 Build and release pipeline

Signing-key generation requires separate explicit approval. After that approval, run the installed CLI from a normal Mac terminal with a restrictive umask and hidden, nonempty password prompts:

```bash
umask 077
mkdir -p "$HOME/.tauri"
env -u CI ./node_modules/.bin/tauri signer generate --write-keys "$HOME/.tauri/kt-hns.key"
```

Back up the private key and password in a password manager. Never display the private key or place it in source, logs, screenshots or Git. Copy only the public `.key.pub` contents into `tauri.conf.json`.

Adding GitHub Actions secrets is a separate external approval: `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. The workflow scopes `contents: write` to its publication job; do not widen repository-wide Actions permissions as a setup step.

The maintained [release workflow](../.github/workflows/release.yml) triggers only on explicit version tags in the canonical repository. It uses immutable action revisions, builds Windows x64 NSIS with updater signing, verifies installer bytes and the protected version comment against the configured public key, prepares exact metadata/checksums, and re-verifies transferred assets before publication. It refuses an existing release or a latest-version rollback and verifies anonymous downloads afterward. Reviewed release notes come from `docs/releases/<tag>.md`.

The [build-check workflow](../.github/workflows/build-check.yml) validates ordinary source pushes and produces an unsigned installer artifact for Windows testing. It does not use signing secrets or create a public Release.

Public assets are the versioned installer, its `.exe.sig`, an identical stable `KT-Hydration-Nation-Station-setup.exe` download alias, `latest.json` and `SHA256SUMS.txt`. The updater uses the versioned filename; the README uses the stable alias.

Build, test and review locally first. Source push, tag creation/push, secrets/settings and public publication each require explicit approval. Pushing a version tag starts automatic publication, so approval of that trigger must cover publication too. Follow [Release and Recovery](Release_and_Recovery.md) for the concrete gates, expected assets and recovery steps.

### 4.10 Auto-update flow

With the existing preference enabled, the frontend checks at launch and every six hours using timestamps and tick/wake events. About also supports manual checks. An available update offers Download update, then Restart now / Later after signature verification finishes. Transfer completion alone does not permit installation. Later hides the notice and retains a verified download for the current session; periodic checks still discover a newer repair release.

Restart now freezes mutations, finishes in-flight settings operations and saves hydration data before the passive Windows installer starts. Save failure prevents installation; download/signature or installer-launch failure keeps the existing app usable. Windows exits after successful installer launch; the installer restarts it. A relaunch fallback reports recovery instructions if needed. Losing the private key prevents trusted updates to existing installations; a replacement key requires a manually installed release.

### 4.11 Testing strategy on the Mac (how you "see how it looks")

| Level | What | How | Catches |
|---|---|---|---|
| 1 | UI look and feel, fast | `npm run dev` and open `http://localhost:1420` in **Chrome or Edge on the Mac** (both Chromium, like WebView2). Tauri calls are guarded with `isTauri()` from `@tauri-apps/api/core` and mocked in the browser. | Layout, colours, animations, responsive sizes, dark mode (DevTools emulation) |
| 2 | Real Tauri runtime | `npm run tauri dev` on macOS. Tray, notifications, store, autostart all work in their macOS form. | Plugin wiring, capabilities, store persistence, scheduler logic |
| 3 | Windows behaviour | Windows 11 ARM VM in UTM (or VMware Fusion). Download the installer artifact from the `build-check` Actions run inside the VM and install it. | Toasts, tray, autostart, SmartScreen flow, WebView2 bootstrap, DPI scaling, updater (install v0.1.0, release v0.1.1) |
| 4 | Final | The real laptop. | x64 vs ARM differences, the owner's Windows settings (Focus Assist, policies) |

VM setup (once, ~1–2 h mostly download time): `brew install --cask utm` (or VMware Fusion from Broadcom, free account); get the Windows 11 ARM ISO with CrystalFetch (free, from the UTM authors) or from Microsoft's "Windows 11 for Arm64" page; UTM → New → Virtualize → Windows, 4 cores, 8 GB RAM, 64 GB disk, keep "Install drivers and SPICE tools" checked; during OOBE use a local account (Shift+F10 → `start ms-cxh:localonly` if setup insists on internet). Unactivated Windows is fine for testing (watermark only); Microsoft's licence terms still apply. Snapshot the clean VM so every install test starts fresh.

### 4.12 Security and privacy

- Local-only data, no telemetry, no remote content; CSP restricts the webview to bundled assets.
- Plugin surface limited by the main-window and platform-specific capability files; update checking goes through the native HTTPS guard.
- Updates verified against the public key compiled into the app; private key in GitHub Secrets + password manager only; `.gitignore` excludes `*.key`.
- The app never runs elevated (per-user install, passive updater).
- SmartScreen warning is the honest cost of not buying a certificate; it's documented for the user instead of hidden.

### 4.13 Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Laptop is Amazon-managed (D4) | Unsigned installer blocked | Confirm before Phase 2. Fallback: PWA on GitHub Pages with the same React UI. |
| Toast click doesn't restore the hidden window | Weaker reminder UX | Verify in Phase 5; implement F-18 popup window in v1.1. |
| JS timers throttled in hidden WebView2 | Missed reminders | Ticker in Rust (4.2), timestamp-based logic (4.5). |
| Changing name/identifier after release | Broken update chain | Decide D1 before the first release. |
| Updater private key lost | No more updates to installed copies | Password-manager backup at key creation. |
| Focus Assist / notifications disabled on the laptop | No toasts | Tray tooltip and icon state, optional popup window, first-run hint to allow notifications. |
| Windows 11 ARM VM differs from x64 laptop | Surprises on the real device | Phase 7 check on the laptop before calling v1 done; ARM64 runner fallback for VM builds. |
| WebView2 missing on an old Windows 10 | App won't start | Installer's `downloadBootstrapper` installs it (needs internet once). |
| Personal project on work hardware (D5) | Policy issue | Confirm up front. |
| macOS 26 menu bar icon is inert in `tauri dev` (observed 4 Nov 2026, tray-icon 0.25.1: icon shows, overlay gets no mouse events; no upstream report yet) | Mac dev loop only; Windows uses a separate Win32 path | Dock-click restores the window on macOS (`RunEvent::Reopen`). Tray clicks and menu are verified on Windows in Phase 5. |

---

## 5. Step-by-step implementation plan

Effort is in Kiro working sessions of roughly 1–3 hours. Each step ends with a verification you can see.

### Phase 0: Decisions and accounts (you, ~30 min)
1. Answer D1–D8 above.
2. Create or confirm a personal GitHub account; create the empty public repo (e.g. `hydrofrog`). Don't initialise it with files; the Mac repo will be pushed to it.
3. Decide the frog's name and a 3–5 line personality note (drives all copy).

### Phase 1: Mac toolchain (~15 min; most is already present)
4. Already installed and verified: Node 22, npm 10, Rust 1.98, Xcode CLT, git. Nothing else is required to run `tauri dev` on macOS.
5. Optional now, required by Phase 5: install UTM (`brew install --cask utm`) and start the Windows 11 ARM download in the background (4.11).
6. Optional: `brew install gh` for creating releases/secrets from the terminal.

### Phase 2: Scaffold, skeleton and CI (1 session)
7. In `~/Documents/Kiro-galo`: `git init`, `git config user.name/user.email` (personal), move the two `.md` files to `docs/`.
8. `npm create tauri-app@latest .` → React, TypeScript, npm; set `productName`, `identifier`, window size. `npm install`.
9. `npm run tauri add notification autostart store updater process opener single-instance`; add `tray-icon` + `image-png` features; write the Rust skeleton from 4.7 (single instance, tray, `--minimized`, ticker, tooltip command); add window permissions to `capabilities/default.json`.
10. Frontend skeleton: routes (Setup/Home/History/Settings/About), hide-on-close, `tick` listener logging to console, `isTauri()` guard so the browser preview works.
11. Verify: `npm run tauri dev` opens the window on macOS, tray icon appears with Open/Quit, close hides, tray restores, second launch focuses. `npm run dev` renders in Chrome.
12. Add `.gitignore`, `README.md` stub, `build-check.yml`; commit; `git remote add origin …`; push. Verify the Actions run on `windows-latest` goes green and produces `KT-Hydration-Nation-Station_0.1.0_x64-setup.exe` as an artifact. Doing this first surfaces Windows build problems while the project is still tiny.

### Phase 3: Core features (2–3 sessions)
13. `core/store.ts`: schema from 4.4, defaults, load/save, migration hook; unit tests with Vitest for totals/streak (`core/stats.ts`).
14. Home screen: progress numbers, quick-add, custom amount, undo, today's entries list; placeholder frog. Verify in browser and `tauri dev`; restart app, data persists.
15. History: 7-day bars with goal line, streak counter.
16. Settings screen with all F-12 items; "launch at login" wired to the autostart plugin; "reset data".
17. Scheduler (`core/scheduler.ts`) exactly as 4.5, driven by the Rust tick plus `visibilitychange`/focus events; unit tests covering active hours, pause, snooze, goal met, sleep catch-up (single fire).
18. Notifications (`core/notify.ts`) and sound (`core/sound.ts`); tray tooltip updates via `invoke('set_tray_tooltip')`; tray menu "Log 250 ml" and "Pause 1 h" emit events the frontend handles.
19. Tips: `data/tips.json` (~50 entries), rotation state, tip in home card and in each notification.
20. First-run setup flow (F-13).
21. Verify on macOS with interval = 1 min: notification arrives with sound while the window is hidden; none after goal met or while paused.

### Phase 4: Frog theme and polish (1–2 sessions)
22. Design tokens (`tokens.css`), light/dark via `prefers-color-scheme`, bundled font.
23. `Frog.tsx` with the five SVG states and CSS animations (blink, bob, sigh, celebrate); `Pond.tsx` water level; `LilyPadStreak.tsx`.
24. Celebration on goal (sparkles, flies, ribbit, once per day).
25. App and tray icons: draw a 1024×1024 frog PNG, `npm run tauri icon path/to/frog.png`; simplified 16 px tray silhouette with "due" variant.
26. Copy pass in the frog's voice; About screen with version, "Check for updates", licence/attribution.
27. Verify in Chrome at 360×600 and 420×720, light and dark; record a short screen capture for the README.

### Phase 5: Windows verification in the VM (1 session)
28. Finish VM setup (4.11); snapshot "clean".
29. Download the latest `build-check` artifact inside the VM, install, and walk acceptance criteria 1–6, 8 and 9. Note toast click behaviour (4.6) and DPI results.
30. Fix findings on the Mac, push, re-test from the snapshot. If the x64 build won't start under emulation, add a `windows-11-arm` job with `--target aarch64-pc-windows-msvc` for VM builds only.

### Phase 6: Release pipeline and v0.1.0 (1 session)
31. Generate updater keys (4.9); store private key + password in your password manager; add both GitHub secrets; put the public key in `tauri.conf.json`.
32. Add `release.yml`; set workflow permissions to read/write.
33. Updater UI (`core/updater.ts`): check on launch and every 6 h, frog bubble, "Update now".
34. README: install steps from 3.7 with screenshots of the SmartScreen dialog, FAQ (no toasts? check Focus Assist), build-from-source section, licence.
35. Set `version` 0.1.0 → commit → `git tag v0.1.0` → push tag. Verify the Release exists with `-setup.exe`, `.sig`, `latest.json`.
36. In the VM (from the clean snapshot): install v0.1.0 from the Release link exactly as the README says. Criterion 1 passes.

### Phase 7: Real laptop and first update (~30 min + waiting)
37. On the laptop: follow the README only (no help), note every point of friction, fix the README.
38. Make a visible change, release v0.1.1; confirm the laptop's app offers and installs the update with data intact (criterion 7). v1 is done.

### Phase 8: v1.1 backlog (as wanted)
39. In-app reminder popup (F-18), global hotkey (F-17), end-of-day summary, CSV export, weekly stats; then the fun extras from 3.5.

Total for v1: about 7–9 Kiro sessions plus the Windows download/VM setup time. Phases 2–4 happen entirely on the Mac.

---

## 6. End-user install instructions (draft for the README)

> **Install KT-Hydration-Nation-Station on Windows**
> 1. Download `KT-Hydration-Nation-Station_<version>_x64-setup.exe` from the [latest release](https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/latest).
> 2. If Edge asks, choose **Keep**. When Windows shows "Windows protected your PC", click **More info**, then **Run anyway**. You'll see this once; KT-Hydration-Nation-Station is a free hobby app and isn't signed with a paid certificate.
> 3. The installer takes a few seconds and needs no admin rights. KT-Hydration-Nation-Station opens and asks for your daily goal, your active hours and your frog's name.
> 4. Closing the window keeps KT-Hydration-Nation-Station in the tray (bottom-right, near the clock). Right-click the frog for Pause and Quit. It starts with Windows by default; change that in Settings.
> 5. Updates install themselves. If a reminder never arrives, check Windows **Settings → System → Notifications** and **Focus assist**.
>
> **Uninstall**: Windows Settings → Apps → KT-Hydration-Nation-Station → Uninstall.

---

## 7. Sources (verified 4 Nov 2026 unless noted)

- Tauri prerequisites (macOS: Xcode CLT, Rust, Node): https://v2.tauri.app/start/prerequisites/
- Tauri updater plugin (keys, `createUpdaterArtifacts`, GitHub `latest.json`, Windows `installMode`, quit-before-install): https://v2.tauri.app/plugin/updater/
- Tauri notification plugin (Windows "only works for installed apps", permission flow): https://v2.tauri.app/plugin/notification/
- Tauri autostart, store, process, single-instance plugins (permissions, register-first note): https://v2.tauri.app/plugin/autostart/ · https://v2.tauri.app/plugin/store/ · https://v2.tauri.app/plugin/process/ · https://v2.tauri.app/plugin/single-instance/
- Tauri system tray (`tray-icon` feature, JS/Rust APIs): https://v2.tauri.app/learn/system-tray/
- Tauri Windows installer (WebView2 install modes, cross-compiling caveats): https://v2.tauri.app/distribute/windows-installer/
- Tauri GitHub Actions guide and `tauri-action` README (inputs incl. `updaterJsonPreferNsis`, `releaseAssetNamePattern`, `uploadWorkflowArtifacts`): https://v2.tauri.app/distribute/pipelines/github/ · https://github.com/tauri-apps/tauri-action
- UTM Windows 11 guide (ISO via CrystalFetch or Microsoft, local-account trick): https://docs.getutm.app/guides/windows/
- VMware Fusion free for all users since 11 Nov 2024: https://blogs.vmware.com/cloud-foundation/2024/11/11/vmware-fusion-and-workstation-are-now-free-for-all-users/
- WebView2 distribution (bootstrapper installs the runtime matching the device architecture): https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution
- GitHub `windows-11-arm` hosted runners, free in public repos: https://github.blog/changelog/2025-04-14-windows-arm64-hosted-runners-now-available-in-public-preview/
- From the 21 Sep 2026 session: Microsoft Store individual registration free since Sep 2025 (https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/); electron-builder needs Wine to build Windows installers on macOS (https://www.electron.build/docs/features/multi-platform-build).
