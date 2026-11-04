use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent, WindowEvent,
};

#[derive(Serialize)]
struct PrinterInfo {
    is_default: bool,
    name: String,
}

#[tauri::command]
fn list_printers() -> Vec<PrinterInfo> {
    let default = printers::get_default_printer().map(|printer| printer.system_name);
    printers::get_printers()
        .into_iter()
        .map(|printer| PrinterInfo {
            is_default: default.as_deref() == Some(printer.system_name.as_str()),
            name: printer.system_name,
        })
        .collect()
}

/// Sends a PDF straight to the named printer, without any dialog.
#[tauri::command]
async fn print_pdf(printer: String, pdf: Vec<u8>) -> Result<u64, String> {
    let printer = printers::get_printer_by_name(&printer)
        .ok_or_else(|| format!("Printer not found: {printer}"))?;
    printer
        .print(&pdf, printers::common::base::job::PrinterJobOptions::none())
        .map_err(|error| error.message)
}

/// Saves a PDF to the temp dir and opens it in the OS default viewer, which provides the print dialog.
#[tauri::command]
#[allow(deprecated)]
fn open_pdf(app: AppHandle, pdf: Vec<u8>, filename: String) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;

    let stem = std::path::Path::new(&filename)
        .file_stem()
        .and_then(|stem| stem.to_str())
        .filter(|stem| !stem.is_empty())
        .unwrap_or("recibo");
    let path = std::env::temp_dir().join(format!("{stem}.pdf"));
    std::fs::write(&path, pdf).map_err(|error| error.to_string())?;
    app.shell()
        .open(path.to_string_lossy().into_owned(), None)
        .map_err(|error| error.to_string())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Abrir", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    let mut tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
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
                show_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_statusbar_style::init())
        .invoke_handler(tauri::generate_handler![list_printers, open_pdf, print_pdf])
        .setup(|app| {
            #[cfg(desktop)]
            setup_tray(app.handle())?;
            Ok(())
        })
        // Closing the window only hides it: the app keeps running in the tray.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app, event| {
        // Exit only through the tray menu (explicit exit code).
        if let RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}
