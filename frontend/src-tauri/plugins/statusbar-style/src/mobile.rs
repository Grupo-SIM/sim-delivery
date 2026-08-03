use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::SetAppearanceRequest;
use crate::Result;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.jbmidia.zero_grau.statusbarstyle";

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> Result<StatusbarStyle<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "StatusbarStylePlugin")?;

    Ok(StatusbarStyle(handle))
}

pub struct StatusbarStyle<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> StatusbarStyle<R> {
    pub fn set_appearance(&self, payload: SetAppearanceRequest) -> Result<()> {
        self.0
            .run_mobile_plugin("setAppearance", payload)
            .map_err(Into::into)
    }
}
