import { describe, expect, it } from "bun:test";
import { createPermissions } from "./createPermissions";
import { isRole, roles } from "./roles";

describe("roles guards", () => {
	it("recognises valid roles and rejects others", () => {
		for (const role of roles) {
			expect(isRole(role)).toBe(true);
		}
		expect(isRole("hacker")).toBe(false);
		expect(isRole(42)).toBe(false);
		expect(isRole(null)).toBe(false);
	});
});

describe("createPermissions matrix", () => {
	it("superAdmin has every platform permission", () => {
		const superAdmin = createPermissions("superAdmin");
		expect(superAdmin.check("branding", "read")).toBe(true);
		expect(superAdmin.check("branding", "update")).toBe(true);
		expect(superAdmin.check("company", "create")).toBe(true);
		expect(superAdmin.check("company", "delete")).toBe(true);
		expect(superAdmin.check("company", "read")).toBe(true);
		expect(superAdmin.check("company", "update")).toBe(true);
		expect(superAdmin.check("coupons", "apply")).toBe(true);
		expect(superAdmin.check("coupons", "create")).toBe(true);
		expect(superAdmin.check("coupons", "delete")).toBe(true);
		expect(superAdmin.check("coupons", "read")).toBe(true);
		expect(superAdmin.check("coupons", "update")).toBe(true);
		expect(superAdmin.check("customers", "read")).toBe(true);
		expect(superAdmin.check("customers", "update")).toBe(true);
		expect(superAdmin.check("deliveries", "assign")).toBe(true);
		expect(superAdmin.check("deliveries", "read")).toBe(true);
		expect(superAdmin.check("deliveries", "updateStatus")).toBe(true);
		expect(superAdmin.check("inventory", "create")).toBe(true);
		expect(superAdmin.check("inventory", "read")).toBe(true);
		expect(superAdmin.check("inventory", "update")).toBe(true);
		expect(superAdmin.check("menu", "create")).toBe(true);
		expect(superAdmin.check("menu", "delete")).toBe(true);
		expect(superAdmin.check("menu", "read")).toBe(true);
		expect(superAdmin.check("menu", "update")).toBe(true);
		expect(superAdmin.check("menu", "updateAvailability")).toBe(true);
		expect(superAdmin.check("orders", "create")).toBe(true);
		expect(superAdmin.check("orders", "print")).toBe(true);
		expect(superAdmin.check("orders", "read")).toBe(true);
		expect(superAdmin.check("orders", "updateStatus")).toBe(true);
		expect(superAdmin.check("reports", "dashboard")).toBe(true);
		expect(superAdmin.check("reports", "read")).toBe(true);
		expect(superAdmin.check("receiptTemplate", "update")).toBe(true);
		expect(superAdmin.check("reviews", "create")).toBe(true);
		expect(superAdmin.check("reviews", "read")).toBe(true);
		expect(superAdmin.check("staff", "invite")).toBe(true);
		expect(superAdmin.check("staff", "assignOperational")).toBe(true);
		expect(superAdmin.check("staff", "inviteOwner")).toBe(true);
		expect(superAdmin.check("staff", "read")).toBe(true);
		expect(superAdmin.check("staff", "remove")).toBe(true);
		expect(superAdmin.check("staff", "setRole")).toBe(true);
		expect(superAdmin.check("units", "create")).toBe(true);
		expect(superAdmin.check("units", "delete")).toBe(true);
		expect(superAdmin.check("units", "read")).toBe(true);
		expect(superAdmin.check("units", "update")).toBe(true);
		expect(superAdmin.check("unitWhatsApp", "manage")).toBe(true);
		expect(createPermissions("owner").check("company", "create")).toBe(false);
		expect(createPermissions("owner").check("company", "read")).toBe(false);
		expect(createPermissions("manager").check("company", "delete")).toBe(false);
	});

	it("owner and manager manage store operations, while only owner manages units", () => {
		for (const permix of [createPermissions("owner"), createPermissions("manager")]) {
			expect(permix.check("menu", "update")).toBe(true);
			expect(permix.check("menu", "updateAvailability")).toBe(true);
			expect(permix.check("reports", "read")).toBe(true);
			expect(permix.check("receiptTemplate", "update")).toBe(true);
			expect(permix.check("staff", "invite")).toBe(true);
			expect(permix.check("unitWhatsApp", "manage")).toBe(true);
		}
		expect(createPermissions("owner").check("units", "create")).toBe(true);
		expect(createPermissions("manager").check("units", "create")).toBe(false);
		expect(createPermissions("manager").check("units", "update")).toBe(false);
		expect(createPermissions("attendant").check("unitWhatsApp", "manage")).toBe(false);
	});

	it("only owner and superAdmin may update branding", () => {
		expect(createPermissions("owner").check("branding", "update")).toBe(true);
		expect(createPermissions("superAdmin").check("branding", "update")).toBe(true);
		expect(createPermissions("manager").check("branding", "update")).toBe(false);
	});

	it("only owner and superAdmin may invite another owner", () => {
		expect(createPermissions("superAdmin").check("staff", "inviteOwner")).toBe(true);
		expect(createPermissions("owner").check("staff", "inviteOwner")).toBe(true);
		expect(createPermissions("manager").check("staff", "inviteOwner")).toBe(false);
	});

	it("limits withdrawal access to owners", () => {
		expect(createPermissions("owner").check("withdrawals", "read")).toBe(true);
		expect(createPermissions("owner").check("withdrawals", "request")).toBe(true);
		expect(createPermissions("superAdmin").check("withdrawals", "configure")).toBe(true);
		for (const role of ["manager", "attendant", "kitchen", "courier", "customer"] as const) {
			expect(createPermissions(role).check("withdrawals", "configure")).toBe(false);
			expect(createPermissions(role).check("withdrawals", "read")).toBe(false);
			expect(createPermissions(role).check("withdrawals", "request")).toBe(false);
		}
		expect(createPermissions("superAdmin").check("withdrawals", "read")).toBe(false);
		expect(createPermissions("superAdmin").check("withdrawals", "request")).toBe(false);
	});

	it("attendant pauses product sales and assigns operational staff without dashboards, team access, catalog or finances", () => {
		const permix = createPermissions("attendant");
		expect(permix.check("orders", "create")).toBe(true);
		expect(permix.check("coupons", "apply")).toBe(true);
		expect(permix.check("customers", "read")).toBe(true);
		expect(permix.check("inventory", "read")).toBe(true);
		expect(permix.check("inventory", "update")).toBe(false);
		expect(permix.check("menu", "update")).toBe(false);
		expect(permix.check("menu", "updateAvailability")).toBe(true);
		expect(permix.check("reports", "dashboard")).toBe(false);
		expect(permix.check("reports", "read")).toBe(false);
		expect(permix.check("receiptTemplate", "update")).toBe(false);
		expect(permix.check("staff", "assignOperational")).toBe(true);
		expect(permix.check("staff", "read")).toBe(false);
		expect(permix.check("staff", "invite")).toBe(false);
		expect(permix.check("staff", "setRole")).toBe(false);
	});

	it("kitchen only touches order production", () => {
		const permix = createPermissions("kitchen");
		expect(permix.check("orders", "updateStatus")).toBe(true);
		expect(permix.check("orders", "read")).toBe(true);
		expect(permix.check("staff", "read")).toBe(true);
		expect(permix.check("customers", "read")).toBe(false);
		expect(permix.check("units", "create")).toBe(false);
	});

	it("courier only sees and updates deliveries", () => {
		const permix = createPermissions("courier");
		expect(permix.check("deliveries", "read")).toBe(true);
		expect(permix.check("deliveries", "updateStatus")).toBe(true);
		expect(permix.check("deliveries", "assign")).toBe(false);
		expect(permix.check("orders", "create")).toBe(false);
	});

	it("customer can browse catalog and place orders only", () => {
		const permix = createPermissions("customer");
		expect(permix.check("menu", "read")).toBe(true);
		expect(permix.check("units", "read")).toBe(true);
		expect(permix.check("orders", "create")).toBe(true);
		expect(permix.check("orders", "updateStatus")).toBe(false);
		expect(permix.check("reports", "read")).toBe(false);
	});

	it("permits receipt printing only for operational and kitchen roles", () => {
		for (const role of ["superAdmin", "owner", "manager", "attendant", "kitchen"] as const) {
			expect(createPermissions(role).check("orders", "print")).toBe(true);
		}
		for (const role of ["courier", "customer"] as const) {
			expect(createPermissions(role).check("orders", "print")).toBe(false);
		}
	});

	it("permits receipt customization only for management roles", () => {
		for (const role of ["superAdmin", "owner", "manager"] as const) {
			expect(createPermissions(role).check("receiptTemplate", "read")).toBe(true);
			expect(createPermissions(role).check("receiptTemplate", "update")).toBe(true);
		}
		for (const role of ["attendant", "kitchen", "courier", "customer"] as const) {
			expect(createPermissions(role).check("receiptTemplate", "read")).toBe(false);
			expect(createPermissions(role).check("receiptTemplate", "update")).toBe(false);
		}
	});
});
