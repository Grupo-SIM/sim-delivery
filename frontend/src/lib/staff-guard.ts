import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";

const staffRoles = new Set(["superAdmin", "owner", "employee"]);

/** Route `beforeLoad` gate: back-office roles (owner/employee/superAdmin) only (docs/03). */
export async function requireStaffBeforeLoad() {
	const { isAuthenticated, role } = useAuthStore.getState();
	if (!isAuthenticated || !role || !staffRoles.has(role)) {
		throw redirect({ to: "/login" });
	}
}
