import { redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { showToast } from "@/stores";

const staffRoles = new Set(["superAdmin", "owner", "manager", "attendant", "kitchen"]);

/** Back-office roles (owner/manager/attendant/kitchen/superAdmin) that may access /admin (docs/03). */
export function isStaff(role: string | null | undefined): boolean {
	return !!role && staffRoles.has(role);
}

/** Route `beforeLoad` gate: back-office roles (owner/manager/attendant/kitchen/superAdmin) only (docs/03). */
export async function requireStaffBeforeLoad() {
	const session = await authClient.getSession();
	// A rate-limited session fetch is not "unauthenticated" — don't kick the user to /login for it.
	if (session.error?.status === 429) {
		showToast("Muitas requisições. Tente novamente em instantes.", "warning");
		return;
	}
	const role = (session.data?.user as { role?: string } | null)?.role ?? null;
	if (!session.data?.user || !isStaff(role)) {
		throw redirect({ to: "/login" });
	}
}
