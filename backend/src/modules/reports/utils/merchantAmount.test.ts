import { describe, expect, it } from "bun:test";
import { merchantAmount } from "./merchantAmount";

describe("merchantAmount", () => {
	it("deducts platform fees and the frozen coproduction share", () => {
		expect(merchantAmount({ feeTotalCents: 100, payment: { coproductionCents: 2000 }, total: 10000 })).toBe(7900);
	});

	it("also deducts the SimIntPay fee taken from the merchant share", () => {
		expect(merchantAmount({ feeTotalCents: 100, payment: { coproductionCents: 2000, simintpayFeeCents: 300 }, total: 10000 })).toBe(7600);
		expect(merchantAmount({ feeTotalCents: 0, payment: { simintpayFeeCents: 300 }, total: 10000 })).toBe(9700);
	});

	it("keeps legacy orders without coproduction unchanged", () => {
		expect(merchantAmount({ feeTotalCents: 100, payment: null, total: 10000 })).toBe(9900);
		expect(merchantAmount({ feeTotalCents: 0, payment: { coproductionCents: 0 }, total: 5000 })).toBe(5000);
	});

	it("uses the net SimIntPay returned for priced charges, minus coproduction only", () => {
		// BOTH: buyer paid 10500 (500 additives), SimIntPay kept 399 from the merchant.
		expect(merchantAmount({ feeTotalCents: 500, payment: { coproductionCents: 1000, netAmountCents: 9601, simintpayFeeCents: 399 }, total: 10500 })).toBe(8601);
		// ADDITIVE_ONLY: the merchant keeps the base intact.
		expect(merchantAmount({ feeTotalCents: 500, payment: { netAmountCents: 10000 }, total: 10500 })).toBe(10000);
	});

	it("never goes negative", () => {
		expect(merchantAmount({ feeTotalCents: 500, payment: { coproductionCents: 900 }, total: 1000 })).toBe(0);
	});
});
