# Release and recovery

This is the maintainer procedure for the Windows x64 GitHub Release. End users need only the [README](../README.md). Publication is not implied by approval for local preparation.

## Approval boundaries

Local implementation, validation and reviewed local commits may proceed for the version and scope explicitly approved by the user. Obtain **separate explicit approval** before:

- generating the production signing key;
- creating GitHub secrets or changing repository/Actions permissions;
- pushing source;
- creating or pushing a version tag;
- creating/publishing a Release or uploading public assets;
- deleting/replacing a Release or its assets.

**Pushing a `v*` tag starts the publication workflow.** Approval for that push must cover public publication as well as the tag. Ordinary pushes run build-check only. Do not amend, rewrite history or force-push.

## Verified versions and APIs

| Component | Version used |
|---|---|
| Tauri JS API and CLI | 2.12.4 |
| Tauri Rust core | 2.12.5 (locked) |
| Updater JS and Rust | 2.14.1, exact pins |
| Process JS and Rust | 2.4.0, exact pins |
| Node / Rust used in CI | 22.23.2 / 1.98.0 |

Updater requires Rust 1.90+ and Tauri 2.12. Exact installed source was read before integration. The standard plugin's check command is not granted: a native check sets an HTTPS-only client for both metadata and redirected downloads, fixes the Windows x64 target, and validates this repository's exact versioned installer URL.

`download()` must resolve before ready-to-install; its `Finished` event precedes signature verification. Installation verifies again. `requireSignedVersion: true` binds the signed artifact version to metadata; `allowDowngrades: false` keeps the newer-version rule. CLI 2.12.4 build signing writes the version into the cryptographically protected Minisign comment.

Windows installation exits the app after successfully launching NSIS. The app's pre-install save/freeze protects current data. The native pre-exit hook intentionally leaves window/tray resources intact until installer launch succeeds, so a launch error can return to a usable app. A process-plugin relaunch is a fallback if install returns.

Primary references:

- [Official updater documentation](https://v2.tauri.app/plugin/updater/)
- [CLI 2.12.4 build signing](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.12.4/crates/tauri-cli/src/bundle.rs)
- [CLI signed comment format](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.12.4/crates/tauri-cli/src/helpers/updater_signature.rs)
- [tauri-action at the inspected immutable revision](https://github.com/tauri-apps/tauri-action/tree/1deb371b0cd8bd54025b384f1cd735e725c4060f)

## Production signing key — only after separate approval

The production key, public key and both Actions secrets are already configured. Reuse them for v0.1.1; generating or replacing a key is not a routine release step. The setup instructions below apply only to separately approved initial setup or recovery.

The private key belongs **outside the repository**, at `~/.tauri/kt-hns.key`. Its password and a backup of the full key file belong in the user's password manager. The public `.pub` file is safe to read and commit into `tauri.conf.json`.

Run the following **in your own Mac Terminal, only after key-generation approval**, from the repository directory:

```sh
umask 077
mkdir -p "$HOME/.tauri"
env -u CI ./node_modules/.bin/tauri signer generate --write-keys "$HOME/.tauri/kt-hns.key"
```

Enter a **nonempty password** twice at the hidden prompts. Do not put it in command arguments, chat, logs, screenshots or source. Do not add `--ci`, `--password` or `--force`. Unsetting `CI` matters: CI mode would suppress prompting and use an empty password.

The inspected CLI writes the private file with mode `0600`, refuses overwrite without `--force`, and prints **paths only** when `--write-keys` is supplied. Running without `--write-keys` would print key material and must be avoided.

Before continuing, confirm that both private key and password are backed up securely. Never print/read the private key into an agent conversation. Only the public key is inserted into `src-tauri/tauri.conf.json`. Until configured, local builds report updater unavailable, and the Release preflight fails closed.

After **explicit approval to create GitHub secrets**, use repository Actions secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: exact private key file content;
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: its password.

Prefer entering these directly in GitHub's secret UI, without passing them through chat or a terminal command line. Workflow secrets are visible only to the signing build step. Never commit key files or `.env`; `.gitignore` also excludes them.

Updater signing proves update provenance. It **does not provide Authenticode signing or remove SmartScreen**. Paid signing, hosting and subscriptions are outside the approved scope.

### Loss or compromise

Losing the key or its password prevents signing updates that existing installations trust. A new key cannot silently replace the trust anchor in those installations. Recover the secure backup; otherwise publish a separately approved full installer with a new public key and require a manual reinstall preserving data.

If a key is compromised, stop releases and obtain explicit approval for secret revocation and recovery. Anyone with it and its password could create trusted updates. Rotation requires an update signed by the old trusted key that introduces the new public key, or a manual reinstall. Do not reuse a compromised key casually.

## Workflow and assets

[`release.yml`](../.github/workflows/release.yml) runs only for pushed `v*` tags. Its preflight accepts stable tags such as **`v0.1.0`**, exactly matching package.json, npm lock, Cargo manifest/lock and Tauri configuration. The tag commit must belong to main.

Actions are pinned to inspected immutable commits. Default/build permissions are **`contents: read`**. Only the publisher job has **`contents: write`**. No repository-wide permission change is needed. Artifact upload/download uses same-run runtime credentials; no `actions: write`, administration or permission-management scope is requested.

The Windows job tests the app and verifier, builds native `x86_64-pc-windows-msvc` NSIS with updater artifacts enabled by the release-only config, authenticates the installer against the configured public key, and checks signed version/filename. Ordinary builds keep updater artifacts disabled and need no secrets.

The publisher re-verifies the transferred assets, checks that the public repository's remote tag still identifies the built commit, refuses an existing Release, and refuses to replace a newer/equal latest version. It uses `gh release create --verify-tag`, with no clobber/delete/replacement command. Public HTTPS downloads are then checked anonymously against the verified local hashes.

Expected **v0.1.1** public assets, after separately approved publication:

| Asset | Purpose |
|---|---|
| `KT-Hydration-Nation-Station_0.1.1_x64-setup.exe` | Per-user installer and updater payload |
| `KT-Hydration-Nation-Station_0.1.1_x64-setup.exe.sig` | Public updater signature |
| `KT-Hydration-Nation-Station-setup.exe` | Byte-identical stable download alias |
| `latest.json` | Windows x64 updater feed with inline signature |
| `SHA256SUMS.txt` | Optional public download hashes |

No ZIP is needed with Tauri 2 `createUpdaterArtifacts: true`. The updater references the versioned installer; the README's stable URL uses the alias. Planned release title: **KT-Hydration-Nation-Station v0.1.1**. Exact proposed body: [`releases/v0.1.1.md`](releases/v0.1.1.md). Keep the published [v0.1.0 body](releases/v0.1.0.md), tag and assets unchanged.

## Required validation before publication

1. Fresh branch/status/remote/identity and source review; preserve existing Phase 3–5 behavior.
2. Frontend tests, TypeScript/Vite build, npm audit, Rust formatting, Clippy with warnings denied, Rust tests; validate the separate release verifier too.
3. Packaged macOS smoke/CSP checks as a development check; Windows CI installer and artifact inspection are the Windows gate.
4. Check CSP, loopback-only listeners, secret exposure, ignored assets and licensing/provenance.
5. Release-script tests and actual cryptographic verification/metadata validation. An absent/invalid key, signature mismatch, version mismatch, wrong target, unexpected asset or bad hash blocks publication.
6. Independent semantic review; any HIGH or MEDIUM finding blocks.
7. Present diff summary, results, review verdict, key backup/storage confirmation, secret names, workflow permissions, exact tag/title/body/assets and recovery plan.
8. Obtain explicit approval for source push; run Windows CI and remediate any failure. Obtain explicit tag/publication approval before pushing the tag.

All signing, Windows CI and public download evidence must be recorded as actual results, not assumed from workflow code. Update the ignored local HANDOVER.md after every milestone/decision/failure/fix/validation/commit.

## Recovering from a failed update

**Before installation:** network/signature failures leave the running version installed. Retry in About or download from the official Release. Data-save failure blocks installation. Resolve a full/unwritable drive and retry; do not erase history.

**Installer launch failure:** the app remains available with its tray and window. Keep using it or download the installer manually. If installation succeeded but relaunch failed, tray Quit then Start completes the restart.

**App will not start:** make a copy of `%APPDATA%\com.bastienb04.kt-hydration-nation-station\` while the app is fully closed. Run the current official installer again. If uninstall is needed first, keep **Delete the application data** unchecked. Reinstall should retain settings/history.

**Bad published version:** prefer a reviewed, signed repair with a higher version (for example v0.1.2 after v0.1.1), preserving the data schema. Automatic downgrade is intentionally disabled. Never silently replace an existing asset under the same tag; installations could already have cached it.

**Manual rollback:** only after developer review confirms the older version can read the current data schema. Quit and back up data first. If Windows refuses a downgrade, uninstall while keeping application data, then install the older official installer. Back up newer data before restoring an older backup. Do not promise rollback compatibility after a schema change.

**Interrupted publication:** inspect the workflow, Release state and public assets read-only. Do not automatically rerun a mutating publisher, delete a Release, overwrite signatures, retag or change the latest feed. Ask for explicit approval for the concrete recovery action. A post-publication download-check failure does not mean nothing was published.

## Phase 7 deployment and first update

The never-before-seen first-user laptop is available only at presentation. Pre-presentation validation uses the physical Phase 5 Windows laptop, which was uninstalled with its application data removed before the public v0.1.0 install.

On **2026-11-11**, the user reported the public v0.1.0 installation/runtime/update-check baseline passed: fresh Setup, no installer UAC/admin prompt, logging and themes, tray and live reminders, online/offline update checking, and hidden login startup with data preserved. The retained fixture is three entries **250, 125, 250 / 625 ml** dated **2026-11-11**, with the recorded final settings and a closed-app `store.json` backup. This is not yet an actual upgrade test or proof of compatibility on the unseen machine.

1. Keep v0.1.0 installed, the dated fixture and backup intact. Do not uninstall, reset data or add test sips before comparison.
2. Prepare the approved local v0.1.1 version/About-text change, validate and independently review, then obtain separate source-push approval. Inspect Windows CI and its artifact before requesting tag/publication approval.
3. After separately approved publication, verify all five public downloads, installer signature/authenticated version, metadata and hashes. Do not begin the Windows update test before this gate passes.
4. On the Windows laptop without the Mac, check for v0.1.1 in About, choose **Download update** and observe progress/verification. Choose **Later**, confirm v0.1.0 and its data remain usable, then return to About and choose **Restart now**.
5. Confirm About shows **Version 0.1.1** and **“A friendly frog for daily sips and hydration tracking.”** Compare every recorded setting and the same three entries/625 ml. If the local date changed, inspect **2026-11-11** in Week instead of today's Pond total. Recheck tray and login startup.
6. Exercise download failure/retry and documented recovery safely, preserving the fixture and signed public assets. Record actual outcomes; an offline metadata check alone does not establish failed-download or installer recovery.
7. At presentation, install on the unseen machine using only the public download and README, then confirm first setup and core operation. Record remaining Windows 10/missing-WebView2 limitations. Phase 7 remains incomplete until the actual upgrade and recovery evidence is recorded; an unseen-machine test cannot be claimed in advance.
