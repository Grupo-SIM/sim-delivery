import { describe, expect, it } from "bun:test";
import { merchantAmount } from "./merchantAmount";

describe("merchantAmount", () => {
	it("deducts platform fees and the frozen coproduction share", () => {
		expect(merchantAmount({ feeTotalCents: 100, payment: { coproductionCents: 2000 }, total: 10000 })).toBe(7900);
	});

	it("keeps legacy orders without coproduction unchanged", () => {
		expect(merchantAmount({ feeTotalCents: 100, payment: null, total: 10000 })).toBe(9900);
		expect(merchantAmount({ feeTotalCents: 0, payment: { coproductionCents: 0 }, total: 5000 })).toBe(5000);
	});

	it("never goes negative", () => {
		expect(merchantAmount({ feeTotalCents: 500, payment: { coproductionCents: 900 }, total: 1000 })).toBe(0);
	});
});
