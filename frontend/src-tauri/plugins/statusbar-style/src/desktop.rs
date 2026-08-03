use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::SetAppearanceRequest;
use crate::Result;

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> Result<StatusbarStyle<R>> {
    Ok(StatusbarStyle(std::marker::PhantomData))
}

/// No-op on desktop — there is no status bar to style.
pub struct StatusbarStyle<R: Runtime>(std::marker::PhantomData<fn() -> R>);

impl<R: Runtime> StatusbarStyle<R> {
    pub fn set_appearance(&self, _payload: SetAppearanceRequest) -> Result<()> {
        Ok(())
    }
}
