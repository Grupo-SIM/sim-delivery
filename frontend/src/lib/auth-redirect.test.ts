import { describe, expect, it } from "bun:test";
import { getSafeAuthRedirect } from "./auth-redirect";

describe("getSafeAuthRedirect", () => {
	it("keeps internal destinations including their query string", () => {
		expect(getSafeAuthRedirect("/orders?filter=active")).toBe("/orders?filter=active");
	});

	it("rejects external and authentication destinations", () => {
		for (const value of ["https://attacker.test", "//attacker.test", "/identify", "/identify?next=/orders", undefined]) {
			expect(getSafeAuthRedirect(value)).toBeUndefined();
		}
	});
});
