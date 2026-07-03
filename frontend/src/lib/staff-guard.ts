import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";

const staffRoles = new Set(["superAdmin", "owner", "employee"]);

/** Back-office roles (owner/employee/superAdmin) that may access /admin (docs/03). */
export function isStaff(role: string | null | undefined): boolean {
	return !!role && staffRoles.has(role);
}

/** Route `beforeLoad` gate: back-office roles (owner/employee/superAdmin) only (docs/03). */
export async function requireStaffBeforeLoad() {
	const { isAuthenticated, role } = useAuthStore.getState();
	if (!isAuthenticated || !isStaff(role)) {
		throw redirect({ to: "/login" });
	}
}
