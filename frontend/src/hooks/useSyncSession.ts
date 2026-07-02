import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { mapSessionUser, useAuthStore } from "@/stores/auth";

/**
 * Keeps the auth store in sync with the live Better Auth session (login, logout,
 * refresh). Mount once near the app root.
 */
export function useSyncSession() {
	const setUser = useAuthStore(state => state.setUser);
	const { data, isPending } = authClient.useSession();

	useEffect(() => {
		if (isPending) {
			return;
		}

		setUser(data?.user ? mapSessionUser(data.user) : null);
	}, [data, isPending, setUser]);

	return { user: data?.user ?? null };
}
