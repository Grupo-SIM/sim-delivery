import { describe, expect, it } from "bun:test";
import { displayedUnitPrice, feeUnitAmount, normalizeProductFees } from "./platform-fees";

describe("platform fee previews", () => {
	it("matches backend percentage rounding and embeds only embedded fees", () => {
		const fees = normalizeProductFees([
			{ applicationScope: "product", calculationType: "percentage", displayMode: "embedded", id: "embedded", name: "Serviço", value: 333 },
			{ applicationScope: "product", calculationType: "fixed", displayMode: "checkout_only", id: "checkout", name: "Operação", value: 50 },
		]);
		expect(feeUnitAmount(101, fees[0]!)).toBe(3);
		expect(displayedUnitPrice(101, fees)).toBe(104);
	});

	it("drops malformed fee contracts instead of corrupting cart totals", () => {
		expect(normalizeProductFees([
			{ applicationScope: "unknown", calculationType: "fixed", displayMode: "embedded", id: "bad", name: "Bad", value: 10 },
		])).toEqual([]);
	});
});
