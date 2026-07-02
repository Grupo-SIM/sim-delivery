import { describe, expect, it } from "bun:test";
import { createPermissions } from "./createPermissions";
import { employeeLevels, isEmployeeLevel, isRole, roles } from "./roles";

describe("roles guards", () => {
	it("recognises valid roles and rejects others", () => {
		for (const role of roles) {
			expect(isRole(role)).toBe(true);
		}
		expect(isRole("hacker")).toBe(false);
		expect(isRole(42)).toBe(false);
		expect(isRole(null)).toBe(false);
	});

	it("recognises valid employee levels and rejects others", () => {
		for (const level of employeeLevels) {
			expect(isEmployeeLevel(level)).toBe(true);
		}
		expect(isEmployeeLevel("ceo")).toBe(false);
		expect(isEmployeeLevel(undefined)).toBe(false);
	});
});

describe("createPermissions matrix", () => {
	it("superAdmin manages companies; nobody else can", () => {
		expect(createPermissions("superAdmin").check("company", "create")).toBe(true);
		expect(createPermissions("owner").check("company", "create")).toBe(false);
		expect(createPermissions("employee", "manager").check("company", "delete")).toBe(false);
	});

	it("owner and manager get full store management", () => {
		for (const permix of [createPermissions("owner"), createPermissions("employee", "manager")]) {
			expect(permix.check("units", "create")).toBe(true);
			expect(permix.check("menu", "update")).toBe(true);
			expect(permix.check("reports", "read")).toBe(true);
			expect(permix.check("staff", "invite")).toBe(true);
		}
	});

	it("only owner and superAdmin may update branding", () => {
		expect(createPermissions("owner").check("branding", "update")).toBe(true);
		expect(createPermissions("superAdmin").check("branding", "update")).toBe(true);
		expect(createPermissions("employee", "manager").check("branding", "update")).toBe(false);
	});

	it("attendant handles orders/customers but not menu or reports", () => {
		const permix = createPermissions("employee", "attendant");
		expect(permix.check("orders", "create")).toBe(true);
		expect(permix.check("coupons", "apply")).toBe(true);
		expect(permix.check("customers", "read")).toBe(true);
		expect(permix.check("menu", "update")).toBe(false);
		expect(permix.check("reports", "read")).toBe(false);
	});

	it("kitchen only touches order production", () => {
		const permix = createPermissions("employee", "kitchen");
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

	it("employee with no level gets no management rights", () => {
		const permix = createPermissions("employee", null);
		expect(permix.check("units", "create")).toBe(false);
		expect(permix.check("orders", "create")).toBe(false);
	});
});
