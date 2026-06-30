import { redirect } from "@tanstack/react-router";
import { isAdmin, useAuthStore } from "@/stores/auth";

export async function requireAdminBeforeLoad() {
	const { isAuthenticated, role } = useAuthStore.getState();
	if (!isAuthenticated || !isAdmin(role)) {
		throw redirect({ to: "/" });
	}
}
