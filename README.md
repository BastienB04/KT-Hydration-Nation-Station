# KT-Hydration-Nation-Station 🐸

Ribbit is a cartoon frog that reminds you to drink water. Log a quick sip or a custom amount, watch your daily progress, and see seven days of history and streaks. Edit, delete, undo, Snooze and Pause are included.

**Free, local and private:** no accounts, cloud storage, telemetry, subscriptions, or recurring fee. Your settings and water history stay on your computer. Optional update checks and downloads contact GitHub without sending that data.

## Install on Windows

The published installer is for a **64-bit Intel or AMD Windows PC (x64)**. **Physical installation, app and update testing passed on Windows 11 Home 25H2 (x64).** Windows 10 21H2 or later is an intended compatibility target, but **has not been physically tested**; installation and operation there are not guaranteed.

### Check your PC before downloading

1. Open **Settings → System → About**.
2. Find **System type**, then note your Windows **Edition**, **Version** and **OS build** on the same page.
3. Check both your system type and Windows version below. Having Windows 11 or a “64-bit” PC alone does not identify an x64 processor.

| Your system type | What to do |
|---|---|
| **64-bit operating system, x64-based processor** | This is the architecture the installer is built for. Check your Windows version below, then continue. |
| **ARM-based processor / ARM64** | No native ARM64 installer is provided. This app and its updates have not been validated under x64 emulation on ARM. Contact the person who shared Ribbit with you before trying it, or use a Windows x64 PC. |
| **32-bit operating system** | The current installer will not run on 32-bit Windows. No 32-bit installer is provided. An x64 processor with 32-bit Windows still needs a 64-bit Windows installation. |

Changing from 32-bit to 64-bit Windows requires reinstalling Windows and your apps; it is not a routine Windows Update. Back up your files and get help before making that change. Updating Windows does not change an ARM or x86 processor into x64. See [Microsoft's architecture guidance](https://support.microsoft.com/en-us/windows/32-bit-and-64-bit-windows-frequently-asked-questions-c6ca9541-8dce-4d48-0415-94a3faa2e13d).

| Your Windows version | What has been verified |
|---|---|
| **Windows 11, x64** | Tested on Windows 11 Home 25H2. This is the recommended platform; other Windows 11 versions have not each been separately tested. |
| **Windows 10 21H2 or later, x64** | Intended compatibility only; **not physically tested**. Follow the guide, and use the [installation help](#if-installation-still-fails) if it does not work. |
| **Earlier Windows versions** | Outside this release's compatibility target. Check eligibility for Windows 11 using [Microsoft's upgrade guidance](https://support.microsoft.com/en-us/windows/ways-to-install-windows-11-e0edbbfb-cfc5-4011-868b-2ce77ac7c70e), or ask for help choosing a compatible PC. |

Microsoft's [standard Windows 10 support ended on 14 October 2025](https://www.microsoft.com/en-us/windows/end-of-support). Windows 11 is recommended when your PC is eligible. Extended security-update arrangements are separate from this app's untested Windows 10 compatibility.

### Install Ribbit

1. [Download the Windows installer](https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/latest/download/KT-Hydration-Nation-Station-setup.exe). You can also use the [Releases page](https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/latest).

   If the browser pauses the download or shows an unfamiliar-file warning, use the [Edge, Chrome and Firefox download help](#download-help-edge-chrome-and-firefox). You can optionally [verify the download's SHA-256](#optional-download-verification) before opening it.

2. Open `KT-Hydration-Nation-Station-setup.exe`. The Releases page also has the same installer under its versioned name, such as `KT-Hydration-Nation-Station_0.1.1_x64-setup.exe`.
3. If SmartScreen shows **Windows protected your PC / Unknown publisher**, confirm you downloaded this project's official Release, choose **More info → Run anyway**, and continue. The installer has no Authenticode signature. **Keep SmartScreen and Defender enabled.**
4. Follow the installer, then open Ribbit. The app installs for your Windows account; **no administrator password or UAC elevation is expected for the app**. Existing Microsoft WebView2 is reused; if missing, the installer downloads Microsoft's Evergreen runtime, so stay online.
5. Pick your daily goal, active hours and frog name. Ribbit is then ready.

You do not need developer tools, a GitHub account, or the developer's Mac. Installation, reminders and future updates work on the Windows PC itself.

### Download help: Edge, Chrome and Firefox

A browser download warning can appear before the separate Windows SmartScreen prompt. The per-file confirmations below apply **only to an uncommon or unfamiliar-file warning for this project's official Release**. Confirm the source first; an unfamiliar file is not the same as a file detected as malware.

| Browser | Where to find the download and handle an unfamiliar-file warning |
|---|---|
| **Microsoft Edge** | Open **Downloads** with **Ctrl+J**. For **“isn't commonly downloaded”**, choose the file's **… → Keep**, then **Show more → Keep anyway**, or the **down arrow beside Delete → Keep anyway**, depending on the prompt. The latter route was verified in Edge InPrivate during Windows testing. See [Microsoft's download-warning guidance](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-security-smartscreen). |
| **Google Chrome** | Open **Downloads** from the browser menu and read the file's warning. If it identifies only an uncommon or unfamiliar file, confirm the official source and use the per-download confirmation offered. Controls vary with Chrome's version and protection level; if the warning or available action is unclear, report its exact text. See [Google's explanation of download warnings](https://support.google.com/chrome/answer/6261569?hl=en). |
| **Mozilla Firefox** | Open the toolbar's **Downloads** arrow. For **“This file is not commonly downloaded”**, right-click that entry and choose **Allow Download**, or use its right-facing arrow to review the available action. See [Mozilla's download guidance](https://support.mozilla.org/en-US/kb/where-find-and-manage-downloaded-files-firefox). |

**Report this file as safe** in Edge sends feedback to Microsoft; it does not itself retain the local download or immediately remove the warning. InPrivate browsing still uses SmartScreen.

- Wait for the download to finish, then open the completed **.exe** from Downloads or its folder.
- On GitHub, choose the installer from **Releases**. **Code → Download ZIP** downloads source code; `.sig`, `latest.json` and `SHA256SUMS.txt` are verification/update files, not installers.
- If a download does not start or is interrupted, check your internet connection and available disk space, then retry from the official Releases page. For a connection or browser error, trying another up-to-date browser can help; this does not resolve a malware alert.

If a warning identifies **malware, a virus, a dangerous file, phishing or an insecure connection**, stop and report the exact message. Keep browser download protection, SmartScreen and Defender enabled. If **Keep**, **Allow Download** or **Run anyway** is unavailable, report that rather than changing security settings or device policies.

### If installation still fails

1. Recheck **System type** and Windows version above. For a browser-only warning, start with the download help; changing Windows is not needed to use its per-file confirmation.
2. Update your browser using its **About** or **Help** page. Install any Windows updates available to your device and restart:
   - **Windows 11:** Settings → Windows Update → Check for updates.
   - **Windows 10:** Settings → Update & Security → Windows Update → Check for updates.
3. If you use Windows 10 and installation or operation still fails, check [Microsoft's Windows 11 eligibility and upgrade instructions](https://support.microsoft.com/en-us/windows/ways-to-install-windows-11-e0edbbfb-cfc5-4011-868b-2ce77ac7c70e). On an eligible **x64 PC**, back up your files (and [Ribbit data](#data-backup-and-uninstall), if already installed), use the upgrade offered by Windows Update, then retry this guide. An upgrade is not guaranteed to fix every error; if your PC is ineligible or the upgrade is not offered, ask for help before proceeding.
4. If it still does not work, send the person who shared Ribbit with you your Windows **Edition, Version, OS build and System type**, browser name, the step that failed and the exact error text. If Ribbit opens, include its **About** version. Avoid sending passwords or personal device identifiers; screenshots can be cropped to the relevant warning.

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
2. Choose **Restart now** to save your current data and start the update installer. The installer restarts Ribbit when finished. An app originally started at login may return hidden in the tray; click its frog icon to restore the window.
3. Or choose **Later** to keep using Ribbit. Return to About when ready. Nothing installs until you choose Restart now; if you quit before installing, download it again next time.

Updates keep your settings and hydration history. Verification failures block installation. **Updater signing verifies provenance; it does not remove SmartScreen's Unknown publisher prompt.**

If a check or download fails, keep using your current app, check your connection, and try again in About. If saving fails, Ribbit does not start the update; resolve the storage problem and retry. If the installer cannot start, the app remains available.

If an update finishes but the window does not appear, check the tray (including **^**) and click an existing Ribbit icon. If there is no icon, open Ribbit from Start. Check its About version; if it still shows the old version, use tray **Quit**, then reopen from Start. If Ribbit will not open, download the current installer from the official Releases page and run it again. Preserve your data: avoid resetting it or choosing the uninstall data-removal checkbox. See [recovery instructions](docs/Release_and_Recovery.md#recovering-from-a-failed-update) for backups and a developer-approved rollback.

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
