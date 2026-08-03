use tauri::{command, AppHandle, Runtime};

use crate::models::SetAppearanceRequest;
use crate::{Result, StatusbarStyleExt};

#[command]
pub(crate) async fn set_appearance<R: Runtime>(app: AppHandle<R>, light: bool) -> Result<()> {
    app.statusbar_style().set_appearance(SetAppearanceRequest { light })
}
