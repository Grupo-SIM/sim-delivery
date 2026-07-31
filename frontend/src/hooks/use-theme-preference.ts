import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { mapSessionUser, useAuthStore } from "@/stores";

export type ThemeMode = "dark" | "light";

function deviceTheme(): ThemeMode {
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Resolves company default, then device on first login, then the saved user choice. */
export function useThemePreference(allowThemeToggle: boolean, defaultTheme: ThemeMode) {
	const user = useAuthStore(state => state.user);
	const setUser = useAuthStore(state => state.setUser);
	const savedInitialPreferenceForUserId = useRef<string | null>(null);
	const [mode, setMode] = useState<ThemeMode>(defaultTheme);

	useEffect(() => {
		const preferred = user?.themePreference;
		if (!allowThemeToggle) {
			setMode(defaultTheme);
			return;
		}
		if (preferred) {
			setMode(preferred);
			return;
		}

		const inferredMode = deviceTheme();
		setMode(inferredMode);
		if (!user || savedInitialPreferenceForUserId.current === user.id) return;

		savedInitialPreferenceForUserId.current = user.id;
		void authClient.updateUser({ themePreference: inferredMode }).then(async ({ error }) => {
			if (error) {
				savedInitialPreferenceForUserId.current = null;
				return;
			}
			const session = await authClient.getSession();
			if (session.data?.user) setUser(mapSessionUser(session.data.user));
		});
	}, [allowThemeToggle, defaultTheme, setUser, user]);

	const saveThemePreference = useCallback(
		async (preference: ThemeMode) => {
			const { error } = await authClient.updateUser({ themePreference: preference });
			if (error) throw error;
			const session = await authClient.getSession();
			if (session.data?.user) setUser(mapSessionUser(session.data.user));
			setMode(preference);
		},
		[setUser],
	);

	return { mode, saveThemePreference };
}
