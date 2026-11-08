//! KT-Hydration-Nation-Station: Rust core.
//!
//! The Rust side owns only what must keep working while the window is hidden in
//! the tray: the tray icon and menu, a 30-second ticker, single-instance handling
//! and plugin registration. All business logic (reminder schedule, intake log,
//! UI) lives in the TypeScript frontend and is driven by the `tick` event.

use std::{thread, time::Duration};

use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_notification::NotificationExt;
#[cfg(target_os = "macos")]
use tauri_plugin_notification::{Action, ActionType};

mod updates;

const TRAY_ID: &str = "main";
const TICK_SECONDS: u64 = 30;
const MINIMIZED_FLAG: &str = "--minimized";

// Dedicated 32x32 tray icons, rendered from frog_graphic_art_theme/ribbit_svg/icon-tray*.svg.
// The due variant adds a water drop while a reminder is unanswered.
const TRAY_ICON_NORMAL: Image<'static> = tauri::include_image!("icons/tray/tray-normal.png");
const TRAY_ICON_DUE: Image<'static> = tauri::include_image!("icons/tray/tray-due.png");

/// The tray icon for the given reminder state.
fn tray_icon(due: bool) -> Image<'static> {
    if due { TRAY_ICON_DUE } else { TRAY_ICON_NORMAL }
}

// Tray-driven frontend events. The frontend validates these payloads before use.
const TRAY_LOG_EVENT: &str = "tray-log";
const TRAY_PAUSE_EVENT: &str = "tray-pause";
const TRAY_LOG_ML: u32 = 250;
const TRAY_PAUSE_MINUTES: u32 = 60;

// Notification activation. The plugin reports a click on the notification body as
// `tap` and a button click as that action's id. The frontend switches to Pond on
// NOTIFICATION_OPEN_EVENT.
const NOTIFICATION_OPEN_EVENT: &str = "notification-open";
const TAP_ACTION: &str = "tap";
const OPEN_ACTION: &str = "open";
/// Must match `REMINDER_ACTION_TYPE` in `src/platform/tauri.ts`. Registered on macOS
/// only: its NSUserNotificationCenter backend reports a body click only when the
/// notification has at least one action. Windows reports plain-toast body clicks
/// and ignores the unregistered id, so its toast stays without a button.
#[cfg(target_os = "macos")]
const REMINDER_ACTION_TYPE: &str = "reminder";

/// Whether a notification action should bring the main window back.
fn notification_opens_main(action_id: &str) -> bool {
    matches!(action_id, TAP_ACTION | OPEN_ACTION)
}

/// A tray menu action, resolved from a menu-item id.
#[derive(Debug, PartialEq, Eq)]
enum TrayAction {
    Open,
    Log(u32),
    Pause(u32),
    Quit,
}

/// Map a menu-item id to its action, or `None` for an unknown id.
fn tray_action(id: &str) -> Option<TrayAction> {
    match id {
        "open" => Some(TrayAction::Open),
        "log_250" => Some(TrayAction::Log(TRAY_LOG_ML)),
        "pause_1h" => Some(TrayAction::Pause(TRAY_PAUSE_MINUTES)),
        "quit" => Some(TrayAction::Quit),
        _ => None,
    }
}

/// Show, un-minimize and focus the main window. Used by the tray, the
/// single-instance handler, the macOS Dock, notification clicks and the first launch.
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

/// Frontend -> tray: show the due icon while a reminder is unanswered.
#[tauri::command]
fn set_tray_attention(app: AppHandle, due: bool) -> Result<(), String> {
    match app.tray_by_id(TRAY_ID) {
        Some(tray) => tray
            .set_icon(Some(tray_icon(due)))
            .map_err(|e| e.to_string()),
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
    let log = MenuItem::with_id(app, "log_250", "Log 250 ml", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause_1h", "Pause 1 h", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &log, &pause, &separator, &quit])?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(tray_icon(false))
        .tooltip("KT-Hydration-Nation-Station")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match tray_action(event.id().as_ref()) {
            Some(TrayAction::Open) => show_main(app),
            Some(TrayAction::Log(ml)) => {
                let _ = app.emit(TRAY_LOG_EVENT, ml);
            }
            Some(TrayAction::Pause(minutes)) => {
                let _ = app.emit(TRAY_PAUSE_EVENT, minutes);
            }
            Some(TrayAction::Quit) => app.exit(0),
            None => {}
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
        // Windows: HKCU Run key. macOS: LaunchAgent (the builder's default; the
        // `macos_launcher` setter only exists when compiling for macOS).
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .args([MINIMIZED_FLAG])
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            set_tray_tooltip,
            set_tray_attention,
            updates::updater_supported,
            updates::check_for_update
        ])
        .setup(|app| {
            build_tray(app.handle())?;

            // Notification clicks. Registered here, before the webview can send a
            // reminder, because the plugin tracks only notifications shown while a
            // handler exists. The handler lives for the whole process (the plugin has
            // no way to remove it) and runs on the plugin's `notification` thread, so
            // it only queues work: `emit` and the window calls are dispatched to the
            // main thread. The event goes out before the window is shown so the
            // frontend can switch to Pond while still hidden; `show_main` runs either
            // way, so a missing frontend listener never blocks the restore.
            let handle = app.handle().clone();
            app.notification().on_action(move |performed| {
                if notification_opens_main(performed.action_id()) {
                    let _ = handle.emit(NOTIFICATION_OPEN_EVENT, ());
                    show_main(&handle);
                }
            })?;
            #[cfg(target_os = "macos")]
            app.notification().register_action_types(vec![
                ActionType::builder(REMINDER_ACTION_TYPE)
                    .actions(vec![Action::builder(OPEN_ACTION, "Open").build()])
                    .build(),
            ])?;

            // The window is created hidden (tauri.conf.json). Show it unless we were
            // launched by autostart with --minimized, in which case we stay in the tray.
            let launched_minimized = std::env::args().any(|arg| arg == MINIMIZED_FLAG);
            if !launched_minimized {
                show_main(app.handle());
            }

            // Ticker. WebView timers are throttled while the window is hidden; a plain
            // thread is not, so the frontend's scheduler is driven from here.
            let handle = app.handle().clone();
            thread::spawn(move || {
                loop {
                    thread::sleep(Duration::from_secs(TICK_SECONDS));
                    let _ = handle.emit("tick", ());
                }
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

#[cfg(test)]
mod tests {
    use super::{
        TRAY_LOG_ML, TRAY_PAUSE_MINUTES, TrayAction, notification_opens_main, tray_action,
        tray_icon,
    };

    #[test]
    fn tray_icons_are_32_px_squares() {
        for due in [false, true] {
            let icon = tray_icon(due);
            assert_eq!((icon.width(), icon.height()), (32, 32), "due={due}");
        }
    }

    #[test]
    fn due_tray_icon_differs_from_normal() {
        assert_ne!(tray_icon(false).rgba(), tray_icon(true).rgba());
    }

    #[test]
    fn known_ids_map_to_actions() {
        assert_eq!(tray_action("open"), Some(TrayAction::Open));
        assert_eq!(tray_action("log_250"), Some(TrayAction::Log(TRAY_LOG_ML)));
        assert_eq!(
            tray_action("pause_1h"),
            Some(TrayAction::Pause(TRAY_PAUSE_MINUTES))
        );
        assert_eq!(tray_action("quit"), Some(TrayAction::Quit));
    }

    #[test]
    fn unknown_id_maps_to_none() {
        assert_eq!(tray_action("nope"), None);
        assert_eq!(tray_action(""), None);
    }

    #[test]
    fn body_click_and_open_action_restore_the_window() {
        assert!(notification_opens_main("tap"));
        assert!(notification_opens_main("open"));
    }

    #[test]
    fn other_notification_actions_do_not_restore_the_window() {
        for id in ["", "Open", "TAP", "snooze", "__closed"] {
            assert!(!notification_opens_main(id), "{id:?} should not restore");
        }
    }
}
