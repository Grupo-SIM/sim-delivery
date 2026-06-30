import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export function useSyncSession() {
	const setUser = useAuthStore(state => state.setUser);
	const user = useAuthStore(state => state.user);

	useEffect(() => {
		setUser(user);
	}, [setUser, user]);

	return { user };
}
