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

export function getStaffAreaPath(role: string | null | undefined): "/admin" | "/admin/orders" {
	return isOperationalStaff(role) ? "/admin/orders" : "/admin";
}

/** Route `beforeLoad` gate. Operational roles are limited to the orders board. */
export async function requireStaffBeforeLoad(pathname?: string) {
	const session = await authClient.getSession();
	// Transport/server failures are not "unauthenticated". Preserve the current route and session.
	if (session.error && session.error.status !== 401 && session.error.status !== 403) {
		showToast(
			session.error.status === 429
				? "Muitas requisições. Tente novamente em instantes."
				: "Não foi possível validar sua sessão. Tentando novamente.",
			"warning",
		);
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
