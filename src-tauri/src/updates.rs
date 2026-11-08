//! Secure update checks. Download/install use the updater plugin's existing
//! resources; only the check is native so its HTTPS-only client also governs
//! redirected download requests.

use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Manager, ResourceId, Runtime, Webview};
use tauri_plugin_updater::UpdaterExt;

const RELEASES: &str =
    "https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/download";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateMetadata {
    rid: ResourceId,
    current_version: String,
    version: String,
    raw_json: serde_json::Value,
}

fn configured<R: Runtime>(app: &AppHandle<R>) -> bool {
    app.config()
        .plugins
        .0
        .get("updater")
        .and_then(|config| config.get("pubkey"))
        .and_then(serde_json::Value::as_str)
        .is_some_and(|key| !key.trim().is_empty())
}

#[tauri::command]
pub(crate) fn updater_supported(app: AppHandle) -> bool {
    cfg!(all(target_os = "windows", target_arch = "x86_64")) && configured(&app)
}

fn allowed_download(url: &str, version: &str) -> bool {
    url == format!("{RELEASES}/v{version}/KT-Hydration-Nation-Station_{version}_x64-setup.exe")
}

#[tauri::command]
pub(crate) async fn check_for_update(webview: Webview) -> Result<Option<UpdateMetadata>, String> {
    if webview.label() != "main" || !updater_supported(webview.app_handle().clone()) {
        return Err("Updates are available in the configured Windows x64 release.".into());
    }

    let updater = webview
        .updater_builder()
        .target("windows-x86_64")
        .timeout(Duration::from_secs(30))
        .configure_client(|client| client.https_only(true))
        // The default hook hides windows and removes the tray before launching
        // the installer. Keep them usable if Windows cannot start the installer.
        // The controller has already flushed the store; success exits the process.
        .on_before_exit(|| {})
        .build()
        .map_err(|error| error.to_string())?;

    let Some(update) = updater.check().await.map_err(|error| error.to_string())? else {
        return Ok(None);
    };
    if !allowed_download(update.download_url.as_str(), &update.version) {
        return Err("The update does not point to this app's official release installer.".into());
    }

    Ok(Some(UpdateMetadata {
        current_version: update.current_version.clone(),
        version: update.version.clone(),
        raw_json: update.raw_json.clone(),
        rid: webview.resources_table().add(update),
    }))
}

#[cfg(test)]
mod tests {
    use super::allowed_download;

    #[test]
    fn accepts_only_the_matching_official_installer() {
        let expected = "https://github.com/BastienB04/KT-Hydration-Nation-Station/releases/download/v0.1.1/KT-Hydration-Nation-Station_0.1.1_x64-setup.exe";
        assert!(allowed_download(expected, "0.1.1"));
        assert!(!allowed_download(expected, "0.1.2"));
        for url in [
            expected.replace("https:", "http:"),
            expected.replace("github.com/", "github.com.evil.example/"),
            expected.replace("BastienB04/", "another-owner/"),
            expected.replace("v0.1.1/", "v0.1.0/"),
            expected.replace("_x64-", "_arm64-"),
            format!("{expected}?redirect=elsewhere"),
            format!("{expected}#fragment"),
        ] {
            assert!(!allowed_download(&url, "0.1.1"), "{url}");
        }
    }
}
