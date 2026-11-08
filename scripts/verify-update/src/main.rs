//! Release gate using the same maintained Minisign verifier as the updater.
//! This tool reads only a public key, installer and public signature.

use std::{env, fs, path::Path};

use base64::{Engine, engine::general_purpose::STANDARD};
use minisign_verify::{PublicKey, Signature};

fn decode(text: &str) -> Result<String, String> {
    let bytes = STANDARD
        .decode(text.trim())
        .map_err(|_| "Invalid base64 in the public key or signature.")?;
    String::from_utf8(bytes).map_err(|_| "Invalid UTF-8 in the public key or signature.".into())
}

fn authenticate(
    public_key: &str,
    bytes: &[u8],
    encoded_signature: &str,
) -> Result<Signature, String> {
    let key = PublicKey::decode(&decode(public_key)?).map_err(|_| "Invalid updater public key.")?;
    let signature =
        Signature::decode(&decode(encoded_signature)?).map_err(|_| "Invalid updater signature.")?;
    key.verify(bytes, &signature, true)
        .map_err(|_| "The installer signature does not match the configured public key.")?;
    Ok(signature)
}

fn verify_comment(comment: &str, version: &str, filename: &str) -> Result<(), String> {
    for (name, expected) in [("version:", version), ("file:", filename)] {
        let fields: Vec<_> = comment
            .split('\t')
            .filter_map(|field| field.strip_prefix(name))
            .collect();
        if fields.as_slice() != [expected] {
            return Err(format!(
                "The signed {name} field does not match this release."
            ));
        }
    }
    Ok(())
}

fn run(args: &[String]) -> Result<(), String> {
    let [config_file, installer_file, signature_file, version] = args else {
        return Err("Usage: kt-hns-verify-update <tauri.conf.json> <installer.exe> <installer.exe.sig> <version>".into());
    };
    let config: serde_json::Value = serde_json::from_slice(
        &fs::read(config_file).map_err(|_| "Cannot read the public Tauri configuration.")?,
    )
    .map_err(|_| "Invalid Tauri configuration JSON.")?;
    if config.get("version").and_then(serde_json::Value::as_str) != Some(version) {
        return Err("The release version differs from the Tauri configuration.".into());
    }
    let key = config
        .pointer("/plugins/updater/pubkey")
        .and_then(serde_json::Value::as_str)
        .filter(|key| !key.trim().is_empty())
        .ok_or("The production updater public key has not been configured.")?;
    let bytes = fs::read(installer_file).map_err(|_| "Cannot read the installer.")?;
    let encoded_signature =
        fs::read_to_string(signature_file).map_err(|_| "Cannot read the public signature.")?;
    let signature = authenticate(key, &bytes, &encoded_signature)?;
    let filename = Path::new(installer_file)
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or("Invalid installer filename.")?;
    // Authenticate first: the global signature covers the trusted comment.
    verify_comment(signature.trusted_comment(), version, filename)?;
    println!("Installer signature, public key, signed version and filename verified.");
    Ok(())
}

fn main() {
    if let Err(error) = run(&env::args().skip(1).collect::<Vec<_>>()) {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::{STANDARD, authenticate, decode, verify_comment};
    use base64::Engine;

    // Public verification vector from minisign-verify 0.3.0 (MIT).
    // No private key is present; this key is never configured as app trust.
    const KEY: &str = "untrusted comment: minisign public key E7620F1842B4E81F\nRWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3";
    const SIGNATURE: &str = "untrusted comment: public test signature\nRUQf6LRCGA9i559r3g7V1qNyJDApGip8MfqcadIgT9CuhV3EMhHoN1mGTkUidF/z7SrlQgXdy8ofjb7bNJJylDOocrCo8KLzZwo=\ntrusted comment: timestamp:1556193335\tfile:test\ny/rUw2y8/hOUYjZU71eHp/Wo1KZ40fGy2VJEDl34XMJM+TX48Ss/17u3IvIfbVR1FkZZSNCisQbuQY+bHwhEBg==";

    #[test]
    fn authenticates_a_known_public_vector_and_rejects_changed_bytes() {
        let key = STANDARD.encode(KEY);
        let signature = STANDARD.encode(SIGNATURE);
        assert!(authenticate(&key, b"test", &signature).is_ok());
        assert!(authenticate(&key, b"Test", &signature).is_err());
    }

    #[test]
    fn rejects_a_forged_trusted_version_comment() {
        let forged = SIGNATURE.replace("file:test", "file:test\tversion:0.1.0");
        assert!(authenticate(&STANDARD.encode(KEY), b"test", &STANDARD.encode(forged)).is_err());
    }

    #[test]
    fn rejects_bad_or_missing_public_key_and_signature() {
        assert!(authenticate("", b"test", &STANDARD.encode(SIGNATURE)).is_err());
        assert!(authenticate(&STANDARD.encode(KEY), b"test", "invalid").is_err());
        assert!(decode("invalid").is_err());
    }

    #[test]
    fn requires_the_exact_signed_version_and_installer_filename() {
        let comment = "timestamp:1\tfile:app.exe\tversion:0.1.0";
        assert!(verify_comment(comment, "0.1.0", "app.exe").is_ok());
        assert!(verify_comment(comment, "0.1.1", "app.exe").is_err());
        assert!(verify_comment(comment, "0.1.0", "other.exe").is_err());
        assert!(verify_comment("timestamp:1\tfile:app.exe", "0.1.0", "app.exe").is_err());
        assert!(
            verify_comment(
                "file:app.exe\tversion:0.1.0\tversion:0.1.0",
                "0.1.0",
                "app.exe"
            )
            .is_err()
        );
    }
}
