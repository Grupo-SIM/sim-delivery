import { describe, expect, it } from "bun:test";
import { calculatePlatformFees } from "./calculateFees";
import type { EffectiveFeeReturn } from "./dtos";

function fee(input: Partial<EffectiveFeeReturn> & Pick<EffectiveFeeReturn, "id">): EffectiveFeeReturn {
	return {
		applicationScope: "product",
		displayMode: "checkout_only",
		fixedValue: 0,
		name: input.id,
		percentageValue: 200,
		...input,
	};
}

describe("calculatePlatformFees", () => {
	it("stacks product percentage and fixed fees per unit", () => {
		const result = calculatePlatformFees(
			[
				fee({ id: "percentage" }),
				fee({ fixedValue: 25, id: "fixed", percentageValue: 0 }),
			],
			[{ key: "line", quantity: 3, unitPrice: 2_000 }],
		);
		expect(result.fees.map(item => item.amountCents)).toEqual([120, 75]);
		expect(result.feeTotalCents).toBe(195);
	});

	it("calculates order fees from merchant subtotal without fee-on-fee", () => {
		const result = calculatePlatformFees(
			[
				fee({ applicationScope: "product", id: "product", percentageValue: 500 }),
				fee({ applicationScope: "order", id: "order", percentageValue: 200 }),
			],
			[
				{ key: "a", quantity: 2, unitPrice: 1_000 },
				{ key: "b", quantity: 1, unitPrice: 500 },
			],
		);
		expect(result.fees.map(item => item.amountCents)).toEqual([125, 50]);
	});

	it("combines percentage and fixed amounts in a single fee", () => {
		const result = calculatePlatformFees(
			[
				fee({ fixedValue: 100, id: "product", percentageValue: 400 }),
				fee({ applicationScope: "order", fixedValue: 100, id: "order", percentageValue: 400 }),
			],
			[{ key: "line", quantity: 2, unitPrice: 2_500 }],
		);
		expect(result.fees.map(item => item.amountCents)).toEqual([400, 300]);
		expect(result.fees[0].items[0].unitAmountCents).toBe(200);
	});

	it("rounds percentage to nearest cent per product unit", () => {
		const result = calculatePlatformFees([fee({ id: "round", percentageValue: 333 })], [
			{ key: "line", quantity: 2, unitPrice: 101 },
		]);
		expect(result.feeTotalCents).toBe(6);
	});
});
