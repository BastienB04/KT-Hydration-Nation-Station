# KT-Hydration-Nation-Station 🐸

A small Windows desktop app in which Ribbit, a cartoon frog, reminds you to drink water. Log what you drink, watch the pond fill up, keep your streak of lily pads going.

**Status: in development (Phase 4 of 8).** No installer is published yet. The plan and requirements are in [`docs/Requirements_Scoping_Refined.md`](docs/Requirements_Scoping_Refined.md).

## Install (Windows)

Coming with the first release. It will be a single `KT-Hydration-Nation-Station_<version>_x64-setup.exe` download from the Releases page, no admin rights needed, with automatic updates afterwards.

## Develop (macOS, Windows or Linux)

Prerequisites: [Node.js LTS](https://nodejs.org), [Rust](https://rustup.rs), and the Tauri system dependencies for your OS (macOS: `xcode-select --install`; Windows: Visual Studio Build Tools with "Desktop development with C++" and the WebView2 runtime). Details: https://v2.tauri.app/start/prerequisites/

```bash
npm install
npm run tauri dev      # desktop app with hot reload
npm run dev            # UI only, in a browser at http://localhost:1420
npm run build          # type-check and bundle the frontend
npm test -- --run      # unit tests (Vitest)
npm run tauri build    # local installer for your current OS
```

Settings → Ribbit & app → **Theme** picks System, Light or Dark. The choice applies right away; System (the default) follows your Windows or macOS appearance.

Your data (intake log and settings) lives in a `store.json` file in the OS app-data folder for the app identifier (on Windows, `%APPDATA%\com.bastienb04.kt-hydration-nation-station\`).

Windows installers for releases are built by GitHub Actions (`.github/workflows`), not on a developer machine.

## Stack

Tauri 2 (Rust) + React 19 + TypeScript + Vite. Plugins: notification, autostart, store, single-instance, opener; updater and process are added with the first release.

## Licence

MIT (to be added with the first release). Ribbit and all app artwork are original to this project. The bundled Nunito typeface is under the SIL Open Font License 1.1; its licence ships with the app as `licenses/Nunito-OFL.txt` (source: [`public/licenses/Nunito-OFL.txt`](public/licenses/Nunito-OFL.txt)).
