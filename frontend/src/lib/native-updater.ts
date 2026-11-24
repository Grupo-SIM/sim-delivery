import { isTauri } from "@tauri-apps/api/core";

export interface PendingUpdate {
	install: () => Promise<void>;
	version: string;
}

/** In-app updates only exist in the Tauri desktop shell (never mobile, never the browser). */
export const canUpdateNatively = () => isTauri() && !/android|iphone|ipad/i.test(navigator.userAgent);

/** Returns the available release, or null when up to date or when updates are not configured for this build. */
export async function checkNativeUpdate(): Promise<PendingUpdate | null> {
	const { check } = await import("@tauri-apps/plugin-updater");
	const update = await check();
	if (!update) return null;

	return {
		install: async () => {
			await update.downloadAndInstall();
			const { relaunch } = await import("@tauri-apps/plugin-process");
			await relaunch();
		},
		version: update.version,
	};
}
