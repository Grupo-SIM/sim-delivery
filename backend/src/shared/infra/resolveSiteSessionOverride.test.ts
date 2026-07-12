import { describe, expect, it } from "bun:test";
import { resolveSiteSessionOverride } from "./resolveSiteSessionOverride";

describe("resolveSiteSessionOverride", () => {
	it("returns undefined when no site companyId was requested", () => {
		expect(resolveSiteSessionOverride(undefined, { companyId: null, role: "superAdmin" })).toBeUndefined();
	});

	it("scopes superAdmin to the requested site", () => {
		expect(resolveSiteSessionOverride("cmp_1", { companyId: null, role: "superAdmin" })).toEqual({
			companyId: "cmp_1",
			role: "superAdmin",
		});
	});

	it("leaves staff unchanged when the requested site is their own company", () => {
		expect(resolveSiteSessionOverride("cmp_1", { companyId: "cmp_1", role: "owner" })).toBeUndefined();
	});

	it("downgrades staff to customer on a site that isn't their own", () => {
		expect(resolveSiteSessionOverride("cmp_2", { companyId: "cmp_1", role: "owner" })).toEqual({
			companyId: "cmp_2",
			role: "customer",
		});
	});

	it("leaves customers unaffected regardless of the requested site", () => {
		expect(resolveSiteSessionOverride("cmp_1", { companyId: null, role: "customer" })).toBeUndefined();
	});
});
