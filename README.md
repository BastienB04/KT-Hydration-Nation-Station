# KT-Hydration-Nation-Station 🐸

Ribbit is a cartoon frog that reminds you to drink water. Log a quick sip or a custom amount, watch your daily progress, and see seven days of history and streaks. Edit, delete, undo, Snooze and Pause are included.

**Free, local and private:** no accounts, cloud storage, telemetry, subscriptions, or recurring fee. Your settings and water history stay on your computer. Optional update checks and downloads contact GitHub without sending that data.

## Install on Windows

You need a **64-bit Intel or AMD PC (x64)** with **Windows 11** or **Windows 10 21H2 or later**. Physical testing passed on Windows 11 Home 25H2; Windows 10 is an intended compatibility target that has not been physically validated. ARM64 and 32-bit installers are not provided.

1. [Download the Windows installer](https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/latest/download/KT-Hydration-Nation-Station-setup.exe). Downloads become available when the first public release is published. You can also use the [Releases page](https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/latest).
2. Open `KT-Hydration-Nation-Station-setup.exe`. The Releases page also has the same installer under its versioned name, such as `KT-Hydration-Nation-Station_0.1.0_x64-setup.exe`.
3. If SmartScreen shows **Windows protected your PC / Unknown publisher**, confirm you downloaded this project's official Release, choose **More info → Run anyway**, and continue. The installer has no Authenticode signature. **Keep SmartScreen and Defender enabled.**
4. Follow the installer, then open Ribbit. The app installs for your Windows account; **no administrator password or UAC elevation is expected for the app**. Existing Microsoft WebView2 is reused; if missing, the installer downloads Microsoft's Evergreen runtime, so stay online.
5. Pick your daily goal, active hours and frog name. Ribbit is then ready.

You do not need developer tools, a GitHub account, or the developer's Mac. Installation, reminders and future updates work on the Windows PC itself.

## Use Ribbit

- **Pond:** daily total, progress, quick-add buttons, custom amounts, and today's editable sips.
- **Week:** seven-day history and streaks.
- **Settings:** reminders, active days/hours, sound, goal, Launch at login, automatic update checks, and System/Light/Dark theme. System is the default; theme changes apply immediately.
- **About:** version and update controls.

Closing the window keeps Ribbit running in the Windows notification area. If you cannot see the frog, open **^** beside the clock. You can drag it into the visible tray area. Click Ribbit to restore the window, or right-click for **Open**, **Log 250 ml**, **Pause 1 h**, and **Quit**.

Turn on **Launch at login** in Settings to start Ribbit after signing into Windows. It starts hidden in the tray. Closing the window does not turn this off; use Settings to disable it.

## Updates

With **Check for updates** enabled, Ribbit checks at launch and every six hours while running, including after sleep. Disable it in Settings to stop automatic checks. You can still use **About → Check for updates** manually.

When a newer version is available:

1. Choose **Download update**. Ribbit shows progress and verifies the download and its signed version.
2. Choose **Restart now** to save your current data and start the update installer. The installer restarts Ribbit when finished.
3. Or choose **Later** to keep using Ribbit. Return to About when ready. Nothing installs until you choose Restart now; if you quit before installing, download it again next time.

Updates keep your settings and hydration history. Verification failures block installation. **Updater signing verifies provenance; it does not remove SmartScreen's Unknown publisher prompt.**

If a check or download fails, keep using your current app, check your connection, and try again in About. If saving fails, Ribbit does not start the update; resolve the storage problem and retry. If the installer cannot start, the app remains available.

If an update was installed but Ribbit did not restart, use tray **Quit**, then open it from Start. If Ribbit will not open, download the current installer from the official Releases page and run it again. Preserve your data: avoid resetting it or choosing the uninstall data-removal checkbox. See [recovery instructions](docs/Release_and_Recovery.md#recovering-from-a-failed-update) for backups and a developer-approved rollback.

## Notifications and troubleshooting

| What you see | What to do or expect |
|---|---|
| No floating reminder banner | Check Windows notification permissions and **Do Not Disturb**. DND keeps reminders in Notification Center and suppresses banners; Ribbit's own sound may still play if enabled. |
| Clicking a notification does nothing | Clicking a **live on-screen toast** restores and focuses Pond. A toast that already timed out into Notification Center does not restore the app. An old notification cannot launch a closed app. Open Ribbit from the tray or Start. |
| No Ribbit tray icon beside the clock | Check **^**. Windows chooses initial tray placement. |
| No reminders while the PC sleeps | After wake, Ribbit sends at most one catch-up reminder rather than a burst. The app must be running, and active hours/days and Snooze/Pause still apply. |
| App window seems closed | Check the tray. To stop the app completely, choose **Quit** there. |
| A WebView2/runtime error | Stay online and reinstall from the official Release. The existing-runtime path was tested; the missing-runtime bootstrap path has not been physically exercised. |
| Unexpected elevation or installer source | Cancel and verify that the file came from the official Release. The app's per-user installation does not require administrator elevation. |

## Data, backup and uninstall

On Windows, local data is stored at:

```text
%APPDATA%\com.bastienb04.kt-hydration-nation-station\store.json
```

For a backup, choose tray **Quit** first, then copy that folder to a safe location. Restore it only while the app is fully closed.

Uninstall through **Windows Settings → Apps → Installed apps**. Leave **Delete the application data** unchecked to keep history/settings for a later reinstall. Check it only when you want them permanently removed. Uninstall also removes the application and its startup registration. Both data-retention choices were verified on Windows.

### Optional download verification

Each Release includes `SHA256SUMS.txt`. To compare your download, open PowerShell in Downloads:

```powershell
Get-FileHash .\KT-Hydration-Nation-Station-setup.exe -Algorithm SHA256
```

Compare the hash with the line for that exact filename in `SHA256SUMS.txt` from the same Release. Uppercase/lowercase does not matter. If it differs, discard the download and download again from the official Release.

## Develop

Use Node.js **22.23.2** and Rust **1.98.0** (the versions used by CI), plus the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS. The updater plugins require Rust 1.90 or later and Tauri 2.12. On macOS, install Xcode command-line tools; Windows requires Visual Studio Build Tools with Desktop development with C++.

```sh
npm ci
npm run tauri dev      # desktop development
npm run dev            # browser preview: http://127.0.0.1:1420
npm run build
npm test -- --run
npm run test:release
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri build -- --bundles app   # macOS development package
```

Development and preview listeners stay on loopback. Browser preview uses safe adapters and does not contact the update feed. Windows x64 Releases are built by GitHub Actions. Regular CI builds do not require signing secrets and never publish a Release.

Stack: Tauri 2/Rust, React 19, TypeScript, Vite and Vitest. Rust owns desktop lifecycle/tray/autostart/activation/ticks; TypeScript owns persisted data, scheduling, statistics, UI, theme and update decisions. No router, Redux, component library, CSS framework, runtime font CDN or cloud service.

The [refined requirements](docs/Requirements_Scoping_Refined.md) contain the delivery plan. [Release and recovery procedures](docs/Release_and_Recovery.md) explain signing, publication gates and Phase 7 validation.

## Licence and artwork

The project is [MIT licensed](LICENSE). Ribbit and all shipped artwork are original; see [production provenance](src/assets/PROVENANCE.md). The bundled Nunito font uses SIL Open Font License 1.1; [its licence](public/licenses/Nunito-OFL.txt) ships in `licenses/Nunito-OFL.txt`. Third-party design reference images are not shipped or redistributed.
