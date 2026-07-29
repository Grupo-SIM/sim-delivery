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
		expect(superAdmin.check("orders", "create")).toBe(true);
		expect(superAdmin.check("orders", "read")).toBe(true);
		expect(superAdmin.check("orders", "updateStatus")).toBe(true);
		expect(superAdmin.check("reports", "read")).toBe(true);
		expect(superAdmin.check("reviews", "create")).toBe(true);
		expect(superAdmin.check("reviews", "read")).toBe(true);
		expect(superAdmin.check("staff", "invite")).toBe(true);
		expect(superAdmin.check("staff", "inviteOwner")).toBe(true);
		expect(superAdmin.check("staff", "read")).toBe(true);
		expect(superAdmin.check("staff", "remove")).toBe(true);
		expect(superAdmin.check("staff", "setRole")).toBe(true);
		expect(superAdmin.check("units", "create")).toBe(true);
		expect(superAdmin.check("units", "delete")).toBe(true);
		expect(superAdmin.check("units", "read")).toBe(true);
		expect(superAdmin.check("units", "update")).toBe(true);
		expect(createPermissions("owner").check("company", "create")).toBe(false);
		expect(createPermissions("owner").check("company", "read")).toBe(false);
		expect(createPermissions("manager").check("company", "delete")).toBe(false);
	});

	it("owner and manager get full store management", () => {
		for (const permix of [createPermissions("owner"), createPermissions("manager")]) {
			expect(permix.check("units", "create")).toBe(true);
			expect(permix.check("menu", "update")).toBe(true);
			expect(permix.check("reports", "read")).toBe(true);
			expect(permix.check("staff", "invite")).toBe(true);
		}
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

	it("attendant handles orders/customers but not menu or reports", () => {
		const permix = createPermissions("attendant");
		expect(permix.check("orders", "create")).toBe(true);
		expect(permix.check("coupons", "apply")).toBe(true);
		expect(permix.check("customers", "read")).toBe(true);
		expect(permix.check("menu", "update")).toBe(false);
		expect(permix.check("reports", "read")).toBe(false);
	});

	it("kitchen only touches order production", () => {
		const permix = createPermissions("kitchen");
		expect(permix.check("orders", "updateStatus")).toBe(true);
		expect(permix.check("orders", "read")).toBe(true);
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
});
