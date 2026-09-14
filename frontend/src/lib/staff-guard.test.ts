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

const { canAccessAdminPath, canCustomizeReceipt, getStaffAreaPath, isStaff, requireStaffBeforeLoad } = await import("./staff-guard");

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

	it("sends management roles to the administrative area", () => {
		for (const role of ["superAdmin", "owner", "manager"]) {
			expect(getStaffAreaPath(role)).toBe("/admin");
		}
	});

	it("sends attendants to the orders board", () => {
		expect(getStaffAreaPath("attendant")).toBe("/admin/orders");
	});
});

describe("canAccessAdminPath", () => {
	it("limits attendants to catalog, orders and inventory", () => {
		for (const pathname of [
			"/admin/products/",
			"/admin/categories/",
			"/admin/tags/",
			"/admin/orders/",
			"/admin/inventory/",
			"/admin/inventory/movements/",
		]) {
			expect(canAccessAdminPath("attendant", pathname)).toBe(true);
		}

		for (const pathname of [
			"/admin/",
			"/admin/finance/",
			"/admin/customers/",
			"/admin/staff/",
			"/admin/units/",
		]) {
			expect(canAccessAdminPath("attendant", pathname)).toBe(false);
		}
	});

	it("blocks managers from unit routes", () => {
		expect(canAccessAdminPath("manager", "/admin/units/")).toBe(false);
		expect(canAccessAdminPath("manager", "/admin/units/unit_1/products/")).toBe(false);
		expect(canAccessAdminPath("manager", "/admin/products/")).toBe(true);
	});
});

describe("canCustomizeReceipt", () => {
	it("allows only company management and super admins", () => {
		for (const role of ["superAdmin", "owner", "manager"]) expect(canCustomizeReceipt(role)).toBe(true);
		for (const role of ["attendant", "kitchen", "courier", "customer", null]) {
			expect(canCustomizeReceipt(role)).toBe(false);
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

	it("redirects attendants away from unauthorized pages to the orders board", async () => {
		session = { data: { user: { role: "attendant" } } };

		await expect(requireStaffBeforeLoad("/admin/finance/")).rejects.toMatchObject({ to: "/admin/orders" });
	});

	it("redirects managers away from unit pages", async () => {
		session = { data: { user: { role: "manager" } } };

		await expect(requireStaffBeforeLoad("/admin/units/")).rejects.toMatchObject({ to: "/admin" });
	});

	it("lets attendants access their permitted pages", async () => {
		session = { data: { user: { role: "attendant" } } };

		expect(await requireStaffBeforeLoad("/admin/inventory/")).toBeUndefined();
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
