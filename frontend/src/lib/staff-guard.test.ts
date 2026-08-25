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

const { getStaffAreaPath, isStaff, requireStaffBeforeLoad } = await import("./staff-guard");

describe("isStaff", () => {
	it("accepts every back-office role", () => {
		for (const role of ["superAdmin", "owner", "manager", "attendant", "kitchen", "courier"]) {
			expect(isStaff(role)).toBe(true);
		}
	});

	it("rejects roles without administrative access", () => {
		expect(isStaff("customer")).toBe(false);
	});

	it("rejects an absent role", () => {
		expect(isStaff(null)).toBe(false);
		expect(isStaff(undefined)).toBe(false);
		expect(isStaff("")).toBe(false);
	});
});

describe("getStaffAreaPath", () => {
	it("sends kitchen and courier roles to the orders board", () => {
		expect(getStaffAreaPath("kitchen")).toBe("/admin/orders");
		expect(getStaffAreaPath("courier")).toBe("/admin/orders");
	});

	it("sends other staff roles to the administrative area", () => {
		for (const role of ["superAdmin", "owner", "manager", "attendant"]) {
			expect(getStaffAreaPath(role)).toBe("/admin");
		}
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
		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/identify" });
	});

	it("redirects a customer to login", async () => {
		session = { data: { user: { role: "customer" } } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/identify" });
	});

	it("lets a courier through", async () => {
		session = { data: { user: { role: "courier" } } };

		expect(await requireStaffBeforeLoad()).toBeUndefined();
	});

	it("redirects operational roles to the orders board", async () => {
		session = { data: { user: { role: "kitchen" } } };

		await expect(requireStaffBeforeLoad("/admin/products/")).rejects.toMatchObject({ to: "/admin/orders" });
	});

	it("lets operational roles access the orders board without redirecting again", async () => {
		session = { data: { user: { role: "kitchen" } } };

		expect(await requireStaffBeforeLoad("/admin/orders")).toBeUndefined();
	});

	it("redirects a user with no role at all to login", async () => {
		session = { data: { user: {} } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/identify" });
	});

	it("does not treat a rate-limited session fetch as unauthenticated", async () => {
		session = { data: null, error: { status: 429 } };

		// A 429 must keep the user on the current route — logging them out for a rate
		// limit both loses their place and hides the real problem.
		expect(await requireStaffBeforeLoad()).toBeUndefined();
		expect(toasts).toHaveLength(1);
		expect(toasts[0].kind).toBe("warning");
	});

	it("does not treat a database failure as unauthenticated", async () => {
		session = { data: null, error: { status: 500 } };

		expect(await requireStaffBeforeLoad()).toBeUndefined();
		expect(toasts).toEqual([
			{ kind: "warning", message: "Não foi possível validar sua sessão. Tentando novamente." },
		]);
	});

	it("still redirects when the session fetch fails with 401", async () => {
		session = { data: null, error: { status: 401 } };

		await expect(requireStaffBeforeLoad()).rejects.toMatchObject({ to: "/identify" });
		expect(toasts).toHaveLength(0);
	});
});
