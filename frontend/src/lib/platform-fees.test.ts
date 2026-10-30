import { describe, expect, it } from "bun:test";
import { displayedUnitPrice, feeUnitAmount, formatFeeAmount, normalizeProductFees } from "./platform-fees";

describe("platform fee previews", () => {
	it("matches backend percentage rounding and embeds only embedded fees", () => {
		const fees = normalizeProductFees([
			{ applicationScope: "product", displayMode: "embedded", fixedValue: 0, id: "embedded", name: "Serviço", percentageValue: 333 },
			{ applicationScope: "product", displayMode: "checkout_only", fixedValue: 50, id: "checkout", name: "Operação", percentageValue: 0 },
		]);
		expect(feeUnitAmount(101, fees[0]!)).toBe(3);
		expect(displayedUnitPrice(101, fees)).toBe(104);
	});

	it("sums percentage and fixed amounts of a single fee", () => {
		const [fee] = normalizeProductFees([
			{ applicationScope: "product", displayMode: "embedded", fixedValue: 100, id: "mixed", name: "Sim Int Pay", percentageValue: 400 },
		]);
		expect(feeUnitAmount(2_500, fee!)).toBe(200);
		expect(formatFeeAmount(400, 100)).toBe("4,00% + R$\u00a01,00");
	});

	it("drops malformed fee contracts instead of corrupting cart totals", () => {
		expect(normalizeProductFees([
			{ applicationScope: "unknown", displayMode: "embedded", fixedValue: 10, id: "bad", name: "Bad", percentageValue: 0 },
		])).toEqual([]);
	});
});
