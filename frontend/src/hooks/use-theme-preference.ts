import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { resolveThemePreference, type ThemeMode } from "@/lib/theme-preference";
import { mapSessionUser, useAuthStore } from "@/stores";
export type { ThemeMode } from "@/lib/theme-preference";

/** Uses the company default unless theme switching allows an explicit user choice. */
export function useThemePreference(allowThemeToggle: boolean, defaultTheme: ThemeMode | null | undefined) {
	const user = useAuthStore(state => state.user);
	const setUser = useAuthStore(state => state.setUser);
	const [savedPreference, setSavedPreference] = useState<{
		userId: string;
		mode: ThemeMode;
	} | null>(null);
	const preference =
		savedPreference?.userId === user?.id ? savedPreference?.mode : user?.themePreference;
	const [browserTheme, setBrowserTheme] = useState<ThemeMode>(() =>
		typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
	);
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const update = () => setBrowserTheme(media.matches ? "dark" : "light");
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);
	const mode = resolveThemePreference(allowThemeToggle, defaultTheme, preference, browserTheme);

	const saveThemePreference = useCallback(
		async (preference: ThemeMode) => {
			const { error } = await authClient.updateUser({ themePreference: preference });
			if (error) throw error;
			const session = await authClient.getSession();
			if (session.data?.user) setUser(mapSessionUser(session.data.user));
			if (user) setSavedPreference({ userId: user.id, mode: preference });
		},
		[setUser, user],
	);

	return { mode, saveThemePreference };
}
