import { describe, expect, it } from "bun:test";
import { merchantAmount } from "./merchantAmount";

describe("merchantAmount", () => {
	it("deducts platform fees and the frozen coproduction share", () => {
		expect(merchantAmount({ buyerFeeTotalCents: 100, payment: { coproductionCents: 2000 }, total: 10000 })).toBe(7900);
	});

	it("also deducts the SimIntPay fee taken from the merchant share", () => {
		expect(merchantAmount({ buyerFeeTotalCents: 100, payment: { coproductionCents: 2000, sellerFeeCents: 300 }, total: 10000 })).toBe(7600);
		expect(merchantAmount({ buyerFeeTotalCents: 0, payment: { sellerFeeCents: 300 }, total: 10000 })).toBe(9700);
	});

	it("keeps legacy orders without coproduction unchanged", () => {
		expect(merchantAmount({ buyerFeeTotalCents: 100, payment: null, total: 10000 })).toBe(9900);
		expect(merchantAmount({ buyerFeeTotalCents: 0, payment: { coproductionCents: 0 }, total: 5000 })).toBe(5000);
	});

	it("uses the net SimIntPay returned for priced charges, minus coproduction only", () => {
		// BOTH: buyer paid 10500 (500 buyer fees), SimIntPay kept 399 from the merchant.
		expect(merchantAmount({ buyerFeeTotalCents: 500, payment: { coproductionCents: 1000, netAmountCents: 9601, sellerFeeCents: 399 }, total: 10500 })).toBe(8601);
		// ADDITIVE_ONLY: the merchant keeps the base intact.
		expect(merchantAmount({ buyerFeeTotalCents: 500, payment: { netAmountCents: 10000 }, total: 10500 })).toBe(10000);
	});

	it("never goes negative", () => {
		expect(merchantAmount({ buyerFeeTotalCents: 500, payment: { coproductionCents: 900 }, total: 1000 })).toBe(0);
	});
});
