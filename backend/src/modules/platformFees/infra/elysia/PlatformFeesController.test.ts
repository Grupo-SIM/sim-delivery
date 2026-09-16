import { describe, expect, it } from "bun:test";
import { requireSuperAdminRole } from "./PlatformFeesController";

describe("platform fee authorization", () => {
	it("allows only super admins", () => {
		expect(() => requireSuperAdminRole("superAdmin")).not.toThrow();
		expect(() => requireSuperAdminRole("owner")).toThrow("FORBIDDEN");
		expect(() => requireSuperAdminRole(undefined)).toThrow("FORBIDDEN");
	});
});
