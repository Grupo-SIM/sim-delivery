import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { mapSessionUser, useAuthStore } from "@/stores";

export type ThemeMode = "dark" | "light";

/** Uses the company default unless theme switching allows an explicit user choice. */
export function useThemePreference(allowThemeToggle: boolean, defaultTheme: ThemeMode) {
	const user = useAuthStore(state => state.user);
	const setUser = useAuthStore(state => state.setUser);
	const [savedPreference, setSavedPreference] = useState<{
		userId: string;
		mode: ThemeMode;
	} | null>(null);
	const preference =
		savedPreference?.userId === user?.id ? savedPreference?.mode : user?.themePreference;
	const mode = allowThemeToggle ? (preference ?? defaultTheme) : defaultTheme;

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
