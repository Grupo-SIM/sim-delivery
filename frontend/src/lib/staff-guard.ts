import { redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { showToast } from "@/stores";

const staffRoles = new Set(["superAdmin", "owner", "manager", "attendant", "kitchen", "courier"]);
const operationalRoles = new Set(["kitchen", "courier"]);
const attendantPaths = [
	"/admin/orders",
	"/admin/inventory",
	"/admin/products",
	"/admin/categories",
	"/admin/tags",
];

/** Back-office roles, including operational kitchen and courier users, that may access /admin. */
export function isStaff(role: string | null | undefined): boolean {
	return !!role && staffRoles.has(role);
}

export function isOperationalStaff(role: string | null | undefined): boolean {
	return !!role && operationalRoles.has(role);
}

export function isAttendant(role: string | null | undefined): boolean {
	return role === "attendant";
}

export function isManager(role: string | null | undefined): boolean {
	return role === "manager";
}

export function canAccessAllUnits(role: string | null | undefined): boolean {
	return role === "owner" || role === "superAdmin";
}

/** Staff roles without catalog-wide control work on one assigned unit at a time. */
export function requiresSelectedUnit(role: string | null | undefined): boolean {
	return !!role && !["owner", "manager", "superAdmin"].includes(role);
}

export function canManageCatalog(role: string | null | undefined): boolean {
	return role === "owner" || role === "manager" || role === "superAdmin";
}

export function canManageInventory(role: string | null | undefined): boolean {
	return role === "owner" || role === "manager" || role === "superAdmin";
}

export function canCustomizeReceipt(role: string | null | undefined): boolean {
	return role === "owner" || role === "manager" || role === "superAdmin";
}

/** Financial balances and withdrawals are company-owner-only. */
export function canAccessWithdrawals(role: string | null | undefined): boolean {
	return role === "owner";
}

export function canToggleProductAvailability(role: string | null | undefined): boolean {
	return canManageCatalog(role) || isAttendant(role);
}

export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
	const normalizedPath = pathname.replace(/\/+$/, "") || "/";
	if (isManager(role)) return normalizedPath !== "/admin/units" && !normalizedPath.startsWith("/admin/units/");
	if (!isAttendant(role)) return true;
	return attendantPaths.some(path =>
		path === "/admin" ? normalizedPath === path : normalizedPath === path || normalizedPath.startsWith(`${path}/`),
	);
}

export function getStaffAreaPath(role: string | null | undefined): "/admin" | "/admin/orders" {
	return isOperationalStaff(role) || isAttendant(role) ? "/admin/orders" : "/admin";
}

/** Route `beforeLoad` gate. Operational and attendant roles have limited admin routes. */
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
		throw redirect({ search: { redirectTo: undefined }, to: "/identify" });
	}
	if (isOperationalStaff(role) && pathname && pathname !== "/admin/orders" && pathname !== "/admin/orders/") {
		throw redirect({ to: "/admin/orders" });
	}
	if (pathname && !canAccessAdminPath(role, pathname)) {
		throw redirect({ to: isAttendant(role) ? "/admin/orders" : "/admin" });
	}
}
