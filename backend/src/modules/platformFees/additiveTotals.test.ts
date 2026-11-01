import { describe, expect, it } from "bun:test";
import { calculatePlatformFees } from "./calculateFees";
import { productDisplayModeOf, sumAdditiveTotals, syntheticFees } from "./additiveTotals";
import { totalsComponents } from "./feeCoverage";

describe("additive totals", () => {
	it("sums per scope", () => {
		const totals = sumAdditiveTotals([
			{ applicationScope: "order", fixedValue: 50, percentageValue: 100 },
			{ applicationScope: "order", fixedValue: 0, percentageValue: 50 },
			{ applicationScope: "product", fixedValue: 10, percentageValue: 200 },
		]);
		expect(totals).toEqual({ order: { fixedValue: 50, percentageValue: 150 }, product: { fixedValue: 10, percentageValue: 200 } });
		expect(totalsComponents(totals)).toEqual({ fixedCents: 60, ratePpm: 35_000 });
	});

	it("builds one synthetic fee per non-zero scope and prices with calculatePlatformFees rounding", () => {
		const fees = syntheticFees({ order: { fixedValue: 100, percentageValue: 600 }, product: { fixedValue: 0, percentageValue: 333 } });
		expect(fees.map(fee => fee.applicationScope)).toEqual(["order", "product"]);
		const result = calculatePlatformFees(fees, [{ key: "0", quantity: 3, unitPrice: 1_001 }]);
		// order: round(3003 * 6%) + 100 = 180 + 100; product: round(1001 * 3.33%) = 33, x3 = 99.
		expect(result.fees.map(fee => fee.amountCents)).toEqual([280, 99]);
		expect(syntheticFees({ order: { fixedValue: 0, percentageValue: 0 }, product: { fixedValue: 0, percentageValue: 0 } })).toEqual([]);
	});

	it("keeps product fees embedded only when all real ones were", () => {
		expect(productDisplayModeOf([{ applicationScope: "product", displayMode: "embedded" }])).toBe("embedded");
		expect(productDisplayModeOf([{ applicationScope: "product", displayMode: "embedded" }, { applicationScope: "product", displayMode: "product_explicit" }])).toBe("product_explicit");
		expect(productDisplayModeOf([])).toBe("product_explicit");
	});
});
