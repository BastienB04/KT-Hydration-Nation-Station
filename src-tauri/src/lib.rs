//! KT-Hydration-Nation-Station: Rust core.
//!
//! The Rust side owns only what must keep working while the window is hidden in
//! the tray: the tray icon and menu, a 30-second ticker, single-instance handling
//! and plugin registration. All business logic (reminder schedule, intake log,
//! UI) lives in the TypeScript frontend and is driven by the `tick` event.

use std::{thread, time::Duration};

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};

const TRAY_ID: &str = "main";
const TICK_SECONDS: u64 = 30;
const MINIMIZED_FLAG: &str = "--minimized";

/// Show, un-minimize and focus the main window. Used by the tray, the
/// single-instance handler, the macOS Dock and the first launch.
fn show_main<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Frontend -> tray: replace the tooltip, e.g. "Ribbit · 1,250 / 2,000 ml · next 14:30".
#[tauri::command]
fn set_tray_tooltip(app: AppHandle, text: String) -> Result<(), String> {
    match app.tray_by_id(TRAY_ID) {
        Some(tray) => tray.set_tooltip(Some(text)).map_err(|e| e.to_string()),
        None => Err("tray icon not found".to_owned()),
    }
}

/// Tray icon with a context menu. Left-click restores the window, right-click opens
/// the menu. Note: on macOS 26 the `tray-icon` crate's click overlay receives no
/// mouse events at all (observed 4 Nov 2026 with tray-icon 0.25.1), so on the Mac
/// the window is restored from the Dock instead; Windows uses a separate Win32
/// code path and is verified in the Windows VM.
fn build_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .expect("the bundled window icon is always present");

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip("KT-Hydration-Nation-Station")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => show_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // Must stay the first plugin: a second launch focuses the running instance and exits.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main(app)
        }))
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .args([MINIMIZED_FLAG])
                .macos_launcher(tauri_plugin_autostart::MacosLauncher::LaunchAgent)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_tray_tooltip])
        .setup(|app| {
            build_tray(app.handle())?;

            // The window is created hidden (tauri.conf.json). Show it unless we were
            // launched by autostart with --minimized, in which case we stay in the tray.
            let launched_minimized = std::env::args().any(|arg| arg == MINIMIZED_FLAG);
            if !launched_minimized {
                show_main(app.handle());
            }

            // Ticker. WebView timers are throttled while the window is hidden; a plain
            // thread is not, so the frontend's scheduler is driven from here.
            let handle = app.handle().clone();
            thread::spawn(move || loop {
                thread::sleep(Duration::from_secs(TICK_SECONDS));
                let _ = handle.emit("tick", ());
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app, event| {
        // macOS: clicking the Dock icon while the window is hidden brings it back.
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Reopen {
            has_visible_windows: false,
            ..
        } = event
        {
            show_main(app);
        }
        #[cfg(not(target_os = "macos"))]
        let _ = (app, event);
    });
}
