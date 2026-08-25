import { redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { showToast } from "@/stores";
import { isSuperAdmin } from "@/stores/auth";

/** Route `beforeLoad` gate: only the platform operator (superAdmin) may proceed (docs/03). */
export async function requireSuperAdminBeforeLoad() {
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
	if (!session.data?.user) {
		throw redirect({ to: "/identify" });
	}
	if (!isSuperAdmin(role)) {
		throw redirect({ to: "/admin" });
	}
}
