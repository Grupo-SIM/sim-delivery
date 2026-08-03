use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::StatusbarStyle;
#[cfg(mobile)]
use mobile::StatusbarStyle;

pub trait StatusbarStyleExt<R: Runtime> {
    fn statusbar_style(&self) -> &StatusbarStyle<R>;
}

impl<R: Runtime, T: Manager<R>> StatusbarStyleExt<R> for T {
    fn statusbar_style(&self) -> &StatusbarStyle<R> {
        self.state::<StatusbarStyle<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("statusbar-style")
        .invoke_handler(tauri::generate_handler![commands::set_appearance])
        .setup(|app, api| {
            #[cfg(mobile)]
            let statusbar_style = mobile::init(app, api)?;
            #[cfg(desktop)]
            let statusbar_style = desktop::init(app, api)?;

            app.manage(statusbar_style);
            Ok(())
        })
        .build()
}
