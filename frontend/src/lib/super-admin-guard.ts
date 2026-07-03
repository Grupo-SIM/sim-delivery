import { redirect } from "@tanstack/react-router";
import { isSuperAdmin, useAuthStore } from "@/stores/auth";

/** Route `beforeLoad` gate: only the platform operator (superAdmin) may proceed (docs/03). */
export async function requireSuperAdminBeforeLoad() {
	const { isAuthenticated, role } = useAuthStore.getState();
	if (!isAuthenticated) {
		throw redirect({ to: "/login" });
	}
	if (!isSuperAdmin(role)) {
		throw redirect({ to: "/admin" });
	}
}
