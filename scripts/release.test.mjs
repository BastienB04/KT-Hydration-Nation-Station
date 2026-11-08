import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  PRODUCT, REPOSITORY, installerName, installerUrl, publicKeyFingerprint,
  validateConfiguration, validateCsp, validateMetadata, validateNotes, validateChecksums, peMachine, newer,
} from "./release.mjs";

// Public Minisign test key; no private key is present or generated.
const PUBKEY = Buffer.from("untrusted comment: minisign public key E7620F1842B4E81F\nRWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3").toString("base64");
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self' ipc: http://ipc.localhost; media-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
function fixture() {
  return {
    pkg: { name: "kt-hydration-nation-station", version: "0.1.0" },
    npmLock: { version: "0.1.0", packages: { "": { version: "0.1.0" } } },
    tauri: {
      productName: PRODUCT, identifier: "com.bastienb04.kt-hydration-nation-station", version: "0.1.0",
      app: { security: { csp: CSP } },
      bundle: { targets: ["nsis"], createUpdaterArtifacts: false, windows: { nsis: { installMode: "currentUser" } } },
      plugins: { updater: {
        pubkey: PUBKEY, endpoints: [`https://github.com/${REPOSITORY}/releases/latest/download/latest.json`],
        requireSignedVersion: true, allowDowngrades: false, windows: { installMode: "passive" },
      } },
    },
    cargo: '[package]\nname = "kt-hydration-nation-station"\nversion = "0.1.0"\n[dependencies]\n',
    cargoLock: '[[package]]\nname = "kt-hydration-nation-station"\nversion = "0.1.0"\n',
    overlay: { bundle: { createUpdaterArtifacts: true } },
    capabilities: [{ identifier: "windows-updates", platforms: ["windows"], windows: ["main"], permissions: ["updater:allow-download", "updater:allow-install", "process:allow-restart"] }],
    tag: "v0.1.0",
  };
}

test("release gate rejects absent keys and mismatched versions before signing", () => {
  assert.equal(validateConfiguration(fixture()).version, "0.1.0");
  for (const change of [
    f => { f.tag = "v0.1.1"; },
    f => { f.tauri.version = "0.1.1"; },
    f => { f.npmLock.packages[""].version = "0.1.1"; },
    f => { f.cargo = f.cargo.replace('version = "0.1.0"', 'version = "0.1.1"'); },
    f => { f.cargoLock = f.cargoLock.replace('version = "0.1.0"', 'version = "0.1.1"'); },
    f => { f.tauri.plugins.updater.pubkey = ""; },
  ]) {
    const f = fixture(); change(f);
    assert.throws(() => validateConfiguration(f));
  }
});

test("release gate blocks unsafe transport, replay protection and permission bypasses", () => {
  for (const change of [
    f => { f.tauri.plugins.updater.allowDowngrades = true; },
    f => { f.tauri.plugins.updater.requireSignedVersion = false; },
    f => { f.tauri.plugins.updater.dangerousAcceptInvalidCerts = true; },
    f => { f.tauri.plugins.updater.endpoints[0] = "http://example.com/latest.json"; },
    f => { f.capabilities[0].permissions.push("updater:allow-check"); },
    f => { f.capabilities.push({ permissions: ["process:default"] }); },
    f => { f.capabilities[0].platforms.push("macOS"); },
    f => { f.capabilities[0].remote = { urls: ["https://example.com"] }; },
  ]) {
    const f = fixture(); change(f);
    assert.throws(() => validateConfiguration(f));
  }
});

test("CSP gate keeps bundled assets and IPC while rejecting broad sources", () => {
  validateCsp(CSP);
  for (const csp of [null, "", CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"), CSP.replace("font-src 'self'", "font-src https:"), `${CSP}; connect-src *`, CSP.replace("object-src 'none'", "object-src 'self'")]) {
    assert.throws(() => validateCsp(csp));
  }
});

test("public-key parsing rejects malformed key data without accessing private files", () => {
  assert.match(publicKeyFingerprint(PUBKEY), /^[a-f0-9]{16}$/);
  for (const key of ["", "garbage", `${PUBKEY}\n`, Buffer.from("untrusted comment: key\nAAAA").toString("base64")]) {
    assert.throws(() => publicKeyFingerprint(key));
  }
});

test("metadata binds the Windows target, versioned official URL and exact signature", () => {
  const metadata = {
    version: "0.1.0", notes: "Release notes", pub_date: "2026-11-08T21:00:00Z",
    platforms: { "windows-x86_64": { url: installerUrl("0.1.0"), signature: "public-signature" } },
  };
  validateMetadata(metadata, "0.1.0", "public-signature");
  for (const change of [
    m => { m.version = "0.1.1"; },
    m => { m.platforms["windows-x86_64"].url = m.platforms["windows-x86_64"].url.replace("https:", "http:"); },
    m => { m.platforms["windows-x86_64"].signature = "different"; },
    m => { m.platforms["windows-arm64"] = m.platforms["windows-x86_64"]; },
    m => { m.pub_date = "not a date"; },
  ]) {
    const m = structuredClone(metadata); change(m);
    assert.throws(() => validateMetadata(m, "0.1.0", "public-signature"));
  }
});

test("checksums reject changed bytes, duplicate entries and path traversal", () => {
  const bytes = Buffer.from("installer");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const files = new Map([["app.exe", bytes]]);
  validateChecksums(`${digest}  app.exe\n`, files);
  assert.throws(() => validateChecksums(`${digest}  app.exe\n`, new Map([["app.exe", Buffer.from("changed")]])));
  assert.throws(() => validateChecksums(`${digest}  app.exe\n${digest}  app.exe`, files));
  assert.throws(() => validateChecksums(`${digest}  ../app.exe`, files));
});

test("transferred release notes must match the reviewed source even if both copies change", () => {
  validateNotes("Reviewed notes\n", "Reviewed notes\n", "Reviewed notes\n");
  assert.throws(() => validateNotes("Changed notes\n", "Changed notes\n", "Reviewed notes\n"));
  assert.throws(() => validateNotes("Reviewed notes\n", "Changed notes\n", "Reviewed notes\n"));
});

test("Windows build inspection reads PE architecture and rejects malformed executables", () => {
  const bytes = Buffer.alloc(128);
  bytes.write("MZ");
  bytes.writeUInt32LE(80, 0x3c);
  bytes.write("PE\0\0", 80);
  bytes.writeUInt16LE(0x8664, 84);
  assert.equal(peMachine(bytes), 0x8664);
  assert.throws(() => peMachine(Buffer.from("not an executable")));
  bytes.writeUInt32LE(200, 0x3c);
  assert.throws(() => peMachine(bytes));
});

test("stable versions prevent prereleases, filename injection and latest-version rollback", () => {
  assert.equal(installerName("0.1.0"), "KT-Hydration-Nation-Station_0.1.0_x64-setup.exe");
  for (const version of ["v0.1.0", "01.1.0", "0.1.0-beta", "../0.1.0", '0.1.0";command']) assert.throws(() => installerName(version));
  assert.equal(newer("0.1.1", "0.1.0"), true);
  assert.equal(newer("0.1.0", "0.1.1"), false);
  assert.equal(newer("0.1.0", "0.1.0"), false);
  assert.equal(newer("0.10.0", "0.9.9"), true);
});
