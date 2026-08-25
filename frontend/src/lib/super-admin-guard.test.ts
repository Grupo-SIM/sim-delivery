import { beforeEach, describe, expect, it, mock } from "bun:test";

interface Session {
	data: { user: { role?: string } } | null;
	error?: { status: number };
}

let session: Session = { data: null };
const toasts: { kind: string; message: string }[] = [];

mock.module("@/lib/auth-client", () => ({
	authClient: { getSession: async () => session },
}));

mock.module("@/stores", () => ({
	showToast: (message: string, kind: string) => toasts.push({ kind, message }),
}));

mock.module("@tanstack/react-router", () => ({
	redirect: (options: { to: string }) => Object.assign(new Error(`redirect:${options.to}`), options),
}));

const { requireSuperAdminBeforeLoad } = await import("./super-admin-guard");

describe("requireSuperAdminBeforeLoad", () => {
	beforeEach(() => {
		session = { data: null };
		toasts.length = 0;
	});

	it("lets the platform operator through", async () => {
		session = { data: { user: { role: "superAdmin" } } };

		expect(await requireSuperAdminBeforeLoad()).toBeUndefined();
	});

	it("redirects to login when there is no session", async () => {
		await expect(requireSuperAdminBeforeLoad()).rejects.toMatchObject({ to: "/identify" });
	});

	it("sends an authenticated non-superAdmin back to the panel, not to login", async () => {
		session = { data: { user: { role: "owner" } } };

		await expect(requireSuperAdminBeforeLoad()).rejects.toMatchObject({ to: "/admin" });
	});

	it("sends a customer back to the panel too", async () => {
		session = { data: { user: { role: "customer" } } };

		await expect(requireSuperAdminBeforeLoad()).rejects.toMatchObject({ to: "/admin" });
	});

	it("does not treat a rate-limited session fetch as unauthenticated", async () => {
		session = { data: null, error: { status: 429 } };

		// A 429 must keep the user on the current route — logging them out for a rate
		// limit both loses their place and hides the real problem.
		expect(await requireSuperAdminBeforeLoad()).toBeUndefined();
		expect(toasts).toHaveLength(1);
		expect(toasts[0].kind).toBe("warning");
	});

	it("does not treat a database failure as unauthenticated", async () => {
		session = { data: null, error: { status: 500 } };

		expect(await requireSuperAdminBeforeLoad()).toBeUndefined();
		expect(toasts).toEqual([
			{ kind: "warning", message: "Não foi possível validar sua sessão. Tentando novamente." },
		]);
	});

	it("still redirects when the session fetch fails with 403", async () => {
		session = { data: null, error: { status: 403 } };

		await expect(requireSuperAdminBeforeLoad()).rejects.toMatchObject({ to: "/identify" });
		expect(toasts).toHaveLength(0);
	});
});
