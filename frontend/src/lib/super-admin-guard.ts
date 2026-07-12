import { redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { showToast } from "@/stores";
import { isSuperAdmin } from "@/stores/auth";

/** Route `beforeLoad` gate: only the platform operator (superAdmin) may proceed (docs/03). */
export async function requireSuperAdminBeforeLoad() {
	const session = await authClient.getSession();
	// A rate-limited session fetch is not "unauthenticated" — don't kick the user to /login for it.
	if (session.error?.status === 429) {
		showToast("Muitas requisições. Tente novamente em instantes.", "warning");
		return;
	}
	const role = (session.data?.user as { role?: string } | null)?.role ?? null;
	if (!session.data?.user) {
		throw redirect({ to: "/login" });
	}
	if (!isSuperAdmin(role)) {
		throw redirect({ to: "/admin" });
	}
}
