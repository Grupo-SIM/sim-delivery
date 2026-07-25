import { redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { showToast } from "@/stores";

const staffRoles = new Set(["superAdmin", "owner", "manager", "attendant", "kitchen", "courier"]);
const operationalRoles = new Set(["kitchen", "courier"]);

/** Back-office roles, including operational kitchen and courier users, that may access /admin. */
export function isStaff(role: string | null | undefined): boolean {
	return !!role && staffRoles.has(role);
}

export function isOperationalStaff(role: string | null | undefined): boolean {
	return !!role && operationalRoles.has(role);
}

/** Route `beforeLoad` gate. Operational roles are limited to the orders board. */
export async function requireStaffBeforeLoad(pathname?: string) {
	const session = await authClient.getSession();
	// A rate-limited session fetch is not "unauthenticated" — don't kick the user to /identify for it.
	if (session.error?.status === 429) {
		showToast("Muitas requisições. Tente novamente em instantes.", "warning");
		return;
	}
	const role = (session.data?.user as { role?: string } | null)?.role ?? null;
	if (!session.data?.user || !isStaff(role)) {
		throw redirect({ to: "/identify" });
	}
	if (isOperationalStaff(role) && pathname && pathname !== "/admin/orders" && pathname !== "/admin/orders/") {
		throw redirect({ to: "/admin/orders" });
	}
}
