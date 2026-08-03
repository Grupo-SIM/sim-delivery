use serde::{Deserialize, Serialize};

/// Mirrors Android's `WindowInsetsControllerCompat.isAppearanceLightStatusBars`:
/// `light: true` means the status bar area is light, so its icons render dark.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetAppearanceRequest {
    pub light: bool,
}
