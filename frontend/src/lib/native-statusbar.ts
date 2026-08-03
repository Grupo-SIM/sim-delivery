import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Keeps the Android status bar icon color opposite of the app's theme
 * (dark icons on a light background, light icons on a dark background).
 * No-op outside Tauri/Android — the plugin itself also no-ops on desktop.
 */
export function syncStatusBarAppearance(mode: "dark" | "light") {
	if (!isTauri()) return;
	invoke("plugin:statusbar-style|set_appearance", { light: mode === "light" }).catch(() => {
		// Best-effort — desktop/dev environments may not have the plugin wired up.
	});
}
