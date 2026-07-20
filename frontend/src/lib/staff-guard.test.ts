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

const { isStaff, requireStaffBeforeLoad } = await import("./staff-guard");

describe("isStaff", () => {
	it("accepts every back-office role", () => {
		for (const role of ["superAdmin", "owner", "manager", "attendant", "kitchen"]) {
			expect(isStaff(role)).toBe(true);
		}
	});

	it("rejects roles without back-office access", () => {
		expect(isStaff("courier")).toBe(false);
		expect(isStaff("customer")).toBe(false);
	});

	it("rejects an absent role", () => {
		expect(isStaff(null)).toBe(false);
		expect(isStaff(undefined)).toBe(false);
		expect(isStaff("")).toBe(false);
	});
});

describe("requireStaffBeforeLoad", () => {
	beforeEach(() => {
		session = { data: null };
		toasts.length = 0;
	});

	it("lets staff through", async () => {
		session = { data: { user: { role: "manager" } } };

		expect(await requireStaffBeforeLoad()).toBeUndefined();
		expect(toasts).toHaveLength(0);
	});

	it("redirects to login when there is no session", async () => {
		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/login" });
	});

	it("redirects a customer to login", async () => {
		session = { data: { user: { role: "customer" } } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/login" });
	});

	it("redirects a courier to login", async () => {
		session = { data: { user: { role: "courier" } } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/login" });
	});

	it("redirects a user with no role at all to login", async () => {
		session = { data: { user: {} } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/login" });
	});

	it("does not treat a rate-limited session fetch as unauthenticated", async () => {
		session = { data: null, error: { status: 429 } };

		// A 429 must keep the user on the current route — logging them out for a rate
		// limit both loses their place and hides the real problem.
		expect(await requireStaffBeforeLoad()).toBeUndefined();
		expect(toasts).toHaveLength(1);
		expect(toasts[0].kind).toBe("warning");
	});

	it("still redirects when the session fetch fails with 401", async () => {
		session = { data: null, error: { status: 401 } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/login" });
		expect(toasts).toHaveLength(0);
	});
});
