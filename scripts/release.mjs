/**
 * Release gates and asset preparation. Signing happens only in Tauri's CLI;
 * this script never reads a private key or password.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REPOSITORY = "BastienB04/KT-Hydration-Nation-Station";
export const PRODUCT = "KT-Hydration-Nation-Station";
export const DOWNLOAD_ALIAS = `${PRODUCT}-setup.exe`;
const CONFIG_FILE = "src-tauri/tauri.conf.json";
const OUTPUT = "release-assets";
const API = `https://api.github.com/repos/${REPOSITORY}`;
const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

export function installerName(version) {
  assert(STABLE_VERSION.test(version), "Use a stable version such as 0.1.0.");
  return `${PRODUCT}_${version}_x64-setup.exe`;
}

export function installerUrl(version) {
  return `https://github.com/${REPOSITORY}/releases/download/v${version}/${installerName(version)}`;
}

export function publicKeyFingerprint(encoded) {
  assert(typeof encoded === "string" && encoded.length > 0, "The production updater public key is not configured.");
  const decoded = Buffer.from(encoded, "base64");
  assert(decoded.toString("base64") === encoded, "The updater public key is not canonical base64.");
  const lines = decoded.toString("utf8").trim().split(/\r?\n/);
  assert(lines.length === 2 && lines[0].startsWith("untrusted comment:"), "Invalid Minisign public key format.");
  const bytes = Buffer.from(lines[1], "base64");
  assert(bytes.length === 42 && bytes[0] === 0x45 && [0x64, 0x44].includes(bytes[1]), "Invalid Minisign public key bytes.");
  assert(bytes.toString("base64") === lines[1], "Invalid Minisign public key encoding.");
  return hash(bytes).slice(0, 16);
}

export function validateCsp(csp) {
  assert(typeof csp === "string" && csp.length > 0, "A strict production CSP is required.");
  const directives = new Map();
  for (const part of csp.split(";").map(p => p.trim()).filter(Boolean)) {
    const [name, ...sources] = part.split(/\s+/);
    assert(!directives.has(name), `Duplicate CSP directive: ${name}`);
    directives.set(name, sources);
    assert(!sources.some(source => source.includes("unsafe-") || source === "*" || source === "https:"), "Broad or unsafe CSP sources are not allowed.");
  }
  for (const name of ["default-src", "script-src", "style-src", "font-src", "img-src", "media-src"]) {
    assert(JSON.stringify(directives.get(name)) === JSON.stringify(["'self'"]), `${name} must use bundled content only.`);
  }
  for (const name of ["object-src", "base-uri", "form-action", "frame-src"]) {
    assert(JSON.stringify(directives.get(name)) === JSON.stringify(["'none'"]), `${name} must be disabled.`);
  }
  const connect = directives.get("connect-src") ?? [];
  assert(connect.includes("'self'") && connect.includes("ipc:") && connect.includes("http://ipc.localhost"), "CSP must preserve local Tauri IPC.");
  assert(connect.every(source => ["'self'", "ipc:", "http://ipc.localhost"].includes(source)), "Unexpected browser network access in CSP.");
}

function cargoValue(toml, name) {
  const block = toml.split(/^\[/m).find(block => block.startsWith("package]")) ?? "";
  return block.match(new RegExp(`^${name}\\s*=\\s*"([^"]+)"`, "m"))?.[1];
}

export function validateConfiguration({ pkg, npmLock, tauri, cargo, cargoLock, overlay, capabilities, tag }) {
  const version = pkg.version;
  assert(STABLE_VERSION.test(version) && tag === `v${version}`, "The version tag must exactly match package.json (for example v0.1.0).");
  assert(pkg.name === "kt-hydration-nation-station" && tauri.productName === PRODUCT, "The stable app names changed.");
  assert(tauri.identifier === "com.bastienb04.kt-hydration-nation-station", "The stable app identifier changed.");
  assert(npmLock.version === version && npmLock.packages?.[""]?.version === version, "The npm lockfile version differs from the app.");
  assert(tauri.version === version && cargoValue(cargo, "version") === version, "Tauri/Cargo/package versions differ.");
  const appLock = cargoLock.split("[[package]]").find(block => /^name = "kt-hydration-nation-station"$/m.test(block));
  assert(appLock && new RegExp(`^version = "${version.replaceAll(".", "\\.")}"$`, "m").test(appLock), "The Cargo lockfile app version differs.");
  assert(tauri.bundle?.targets?.length === 1 && tauri.bundle.targets[0] === "nsis", "Release must build only the Windows NSIS installer.");
  assert(tauri.bundle.windows?.nsis?.installMode === "currentUser", "Release must retain per-user installation.");
  assert(tauri.bundle.createUpdaterArtifacts === false, "Ordinary builds must not require production signing.");
  assert(JSON.stringify(overlay) === JSON.stringify({ bundle: { createUpdaterArtifacts: true } }), "Unexpected release configuration override.");
  validateCsp(tauri.app?.security?.csp);
  assert(!tauri.app.security.dangerousDisableAssetCspModification, "Tauri CSP modification must stay enabled.");
  const updater = tauri.plugins?.updater;
  assert(JSON.stringify(updater?.endpoints) === JSON.stringify([`https://github.com/${REPOSITORY}/releases/latest/download/latest.json`]), "The updater must use the official HTTPS release feed.");
  assert(updater.requireSignedVersion === true && updater.allowDowngrades === false, "Signed version and downgrade protection are required.");
  assert(updater.windows?.installMode === "passive", "Updates must retain the passive Windows installer.");
  for (const flag of ["dangerousInsecureTransportProtocol", "dangerousAcceptInvalidCerts", "dangerousAcceptInvalidHostnames"]) {
    assert(!updater[flag], `Unsafe updater setting: ${flag}`);
  }
  const forbidden = new Set(["updater:default", "updater:allow-check", "updater:allow-download-and-install", "process:default", "process:allow-exit"]);
  for (const capability of capabilities) {
    assert(!capability.remote, "Remote webviews must not receive app capabilities.");
    for (const permission of capability.permissions ?? []) {
      assert(!forbidden.has(typeof permission === "string" ? permission : permission.identifier), "An update permission bypasses the secure native check.");
    }
  }
  const updates = capabilities.find(capability => capability.identifier === "windows-updates");
  assert(updates && JSON.stringify(updates.platforms) === '["windows"]' && JSON.stringify(updates.windows) === '["main"]', "Update capabilities must be limited to the main Windows window.");
  assert(JSON.stringify([...updates.permissions].sort()) === JSON.stringify(["process:allow-restart", "updater:allow-download", "updater:allow-install"]), "Unexpected update capabilities.");
  return { version, tag, installer: installerName(version), fingerprint: publicKeyFingerprint(updater.pubkey) };
}

export function validateMetadata(manifest, version, signature) {
  assert(manifest.version === version, "Updater metadata version does not match the release.");
  assert(typeof manifest.notes === "string" && manifest.notes.length > 0, "Release notes are missing from metadata.");
  assert(typeof manifest.pub_date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(manifest.pub_date) && Number.isFinite(Date.parse(manifest.pub_date)), "Invalid updater publication date.");
  assert(JSON.stringify(Object.keys(manifest.platforms ?? {})) === '["windows-x86_64"]', "Metadata must contain only the Windows x64 target.");
  const platform = manifest.platforms["windows-x86_64"];
  assert(platform.url === installerUrl(version), "Updater URL is not the official versioned installer.");
  assert(platform.signature === signature && signature.length > 0, "Metadata signature differs from the installer signature.");
}

export function validateNotes(metadataNotes, transferredNotes, reviewedNotes) {
  assert(metadataNotes === reviewedNotes && transferredNotes === reviewedNotes, "Release notes differ from the reviewed source.");
}

export function peMachine(bytes) {
  assert(bytes.length >= 64 && bytes.toString("ascii", 0, 2) === "MZ", "The Windows executable has no DOS header.");
  const offset = bytes.readUInt32LE(0x3c);
  assert(offset <= bytes.length - 6 && bytes.toString("ascii", offset, offset + 4) === "PE\u0000\u0000", "The Windows executable has no PE header.");
  return bytes.readUInt16LE(offset + 4);
}

export function validateChecksums(text, files) {
  const entries = text.trim().split(/\r?\n/).map(line => {
    const match = line.match(/^([a-f0-9]{64})  ([A-Za-z0-9_.-]+)$/);
    assert(match, "Invalid SHA256SUMS entry.");
    return [match[2], match[1]];
  });
  assert(entries.length === files.size && new Set(entries.map(([name]) => name)).size === files.size, "Missing or duplicate checksum entries.");
  for (const [name, expected] of entries) {
    assert(files.has(name) && hash(files.get(name)) === expected, `Checksum mismatch: ${name}`);
  }
}

async function configuration() {
  const capabilityNames = (await readdir("src-tauri/capabilities")).filter(name => name.endsWith(".json"));
  const readJson = async file => JSON.parse(await readFile(file, "utf8"));
  const [pkg, npmLock, tauri, cargo, cargoLock, overlay, capabilities] = await Promise.all([
    readJson("package.json"), readJson("package-lock.json"), readJson(CONFIG_FILE),
    readFile("src-tauri/Cargo.toml", "utf8"), readFile("src-tauri/Cargo.lock", "utf8"),
    readJson("src-tauri/tauri.release.conf.json"),
    Promise.all(capabilityNames.map(name => readJson(`src-tauri/capabilities/${name}`))),
  ]);
  return validateConfiguration({ pkg, npmLock, tauri, cargo, cargoLock, overlay, capabilities, tag: process.env.RELEASE_TAG });
}

function authenticateInstaller(config, installer, signature) {
  execFileSync("cargo", [
    "run", "--locked", "--release", "--manifest-path", "scripts/verify-update/Cargo.toml", "--",
    CONFIG_FILE, installer, signature, config.version,
  ], { stdio: "inherit" });
}

async function prepare(config) {
  const releaseRoot = "src-tauri/target/x86_64-pc-windows-msvc/release";
  const app = await readFile(`${releaseRoot}/kt-hydration-nation-station.exe`);
  assert(peMachine(app) === 0x8664, "The packaged app must be native AMD64/x64.");
  const installer = `${releaseRoot}/bundle/nsis/${config.installer}`;
  const signatureFile = `${installer}.sig`;
  const signature = (await readFile(signatureFile, "utf8")).trim();
  authenticateInstaller(config, installer, signatureFile);
  const notes = await readFile(`docs/releases/${config.tag}.md`, "utf8");
  assert(notes.trim().length > 0, "Write reviewed release notes before tagging.");
  const manifest = {
    version: config.version, notes, pub_date: new Date().toISOString(),
    platforms: { "windows-x86_64": { url: installerUrl(config.version), signature } },
  };
  validateMetadata(manifest, config.version, signature);
  await mkdir(OUTPUT, { recursive: true });
  assert((await readdir(OUTPUT)).length === 0, "Use an empty release-assets directory; stale assets cannot be released.");
  await copyFile(installer, `${OUTPUT}/${config.installer}`);
  await copyFile(installer, `${OUTPUT}/${DOWNLOAD_ALIAS}`);
  await copyFile(signatureFile, `${OUTPUT}/${config.installer}.sig`);
  await writeFile(`${OUTPUT}/latest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(`${OUTPUT}/release-body.md`, notes);
  const names = [config.installer, DOWNLOAD_ALIAS, `${config.installer}.sig`, "latest.json"].sort();
  const checksums = await Promise.all(names.map(async name => `${hash(await readFile(`${OUTPUT}/${name}`))}  ${name}`));
  await writeFile(`${OUTPUT}/SHA256SUMS.txt`, `${checksums.join("\n")}\n`);
  await verify(config);
}

async function verify(config) {
  const names = [config.installer, DOWNLOAD_ALIAS, `${config.installer}.sig`, "latest.json"].sort();
  const expected = [...names, "SHA256SUMS.txt", "release-body.md"].sort();
  assert(JSON.stringify((await readdir(OUTPUT)).sort()) === JSON.stringify(expected), "Unexpected or missing release assets.");
  const files = new Map(await Promise.all(names.map(async name => [name, await readFile(`${OUTPUT}/${name}`)])));
  assert([0x14c, 0x8664].includes(peMachine(files.get(config.installer))), "Invalid Windows installer architecture.");
  assert(hash(files.get(config.installer)) === hash(files.get(DOWNLOAD_ALIAS)), "Stable download differs from the versioned installer.");
  validateChecksums(await readFile(`${OUTPUT}/SHA256SUMS.txt`, "utf8"), files);
  const manifest = JSON.parse(files.get("latest.json").toString("utf8"));
  validateMetadata(manifest, config.version, files.get(`${config.installer}.sig`).toString("utf8").trim());
  validateNotes(
    manifest.notes,
    await readFile(`${OUTPUT}/release-body.md`, "utf8"),
    await readFile(`docs/releases/${config.tag}.md`, "utf8"),
  );
  authenticateInstaller(config, `${OUTPUT}/${config.installer}`, `${OUTPUT}/${config.installer}.sig`);
  console.log(`Verified ${config.tag}: native x64 build, exact assets, signatures, metadata and SHA-256 checksums.`);
}

async function api(endpoint, allowMissing = false) {
  assert(process.env.GH_TOKEN, "A scoped GitHub workflow token is required for publication checks.");
  const response = await fetch(`${API}${endpoint}`, {
    redirect: "error",
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(30_000),
  });
  if (allowMissing && response.status === 404) return null;
  assert(response.ok, `GitHub publication check failed (HTTP ${response.status}).`);
  return response.json();
}

export function newer(a, b) {
  assert(STABLE_VERSION.test(a) && STABLE_VERSION.test(b), "Only stable release versions can be compared.");
  const left = a.split(".").map(BigInt);
  const right = b.split(".").map(BigInt);
  for (let i = 0; i < 3; i += 1) if (left[i] !== right[i]) return left[i] > right[i];
  return false;
}

async function publicationCheck(config) {
  assert(process.env.GITHUB_REPOSITORY === REPOSITORY, "Only the canonical repository may publish this app.");
  const repo = await api("");
  assert(repo.private === false, "The release hub must be public for downloads without a GitHub account.");
  let object = (await api(`/git/ref/tags/${config.tag}`)).object;
  for (let i = 0; object.type === "tag" && i < 4; i += 1) object = (await api(`/git/tags/${object.sha}`)).object;
  assert(object.type === "commit" && object.sha === process.env.RELEASE_COMMIT, "The remote tag changed or does not identify this reviewed build.");
  assert(await api(`/releases/tags/${config.tag}`, true) === null, "This release already exists. Inspect it; never replace assets automatically.");
  const latest = await api("/releases/latest", true);
  if (latest !== null) {
    const previous = latest.tag_name.replace(/^v/, "");
    assert(newer(config.version, previous), "A release cannot replace a newer or equal latest version.");
  }
}

async function anonymousBytes(url) {
  let destination = url;
  for (let redirects = 0; redirects < 6; redirects += 1) {
    assert(new URL(destination).protocol === "https:", "A public download redirected away from HTTPS.");
    const response = await fetch(destination, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      assert(location, "Missing public download redirect.");
      destination = new URL(location, destination).href;
      continue;
    }
    assert(response.ok, `Anonymous download failed (HTTP ${response.status}).`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error("Too many public download redirects.");
}

async function verifyPublic(config) {
  const base = `https://github.com/${REPOSITORY}/releases/latest/download`;
  for (const name of [DOWNLOAD_ALIAS, config.installer, "latest.json", `${config.installer}.sig`, "SHA256SUMS.txt"]) {
    const local = await readFile(`${OUTPUT}/${name}`);
    const remote = await anonymousBytes(`${base}/${name}`);
    assert(hash(local) === hash(remote), `Public asset differs from the verified build: ${name}`);
  }
  console.log("Anonymous HTTPS downloads match every verified public asset.");
}

export async function main(mode) {
  const config = await configuration();
  if (mode === "preflight") {
    console.log(`${config.tag}, ${config.installer}, public-key fingerprint ${config.fingerprint}.`);
  } else if (mode === "prepare") await prepare(config);
  else if (mode === "verify") await verify(config);
  else if (mode === "publication-check") await publicationCheck(config);
  else if (mode === "verify-public") await verifyPublic(config);
  else throw new Error("Use preflight, prepare, verify, publication-check or verify-public.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv[2]).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
