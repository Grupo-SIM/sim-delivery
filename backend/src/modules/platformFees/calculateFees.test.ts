import { describe, expect, it } from "bun:test";
import { calculatePlatformFees } from "./calculateFees";
import type { EffectiveFeeReturn } from "./dtos";

function fee(input: Partial<EffectiveFeeReturn> & Pick<EffectiveFeeReturn, "id">): EffectiveFeeReturn {
	return {
		applicationScope: "product",
		calculationType: "percentage",
		displayMode: "checkout_only",
		name: input.id,
		value: 200,
		...input,
	};
}

describe("calculatePlatformFees", () => {
	it("stacks product percentage and fixed fees per unit", () => {
		const result = calculatePlatformFees(
			[
				fee({ id: "percentage" }),
				fee({ calculationType: "fixed", id: "fixed", value: 25 }),
			],
			[{ key: "line", quantity: 3, unitPrice: 2_000 }],
		);
		expect(result.fees.map(item => item.amountCents)).toEqual([120, 75]);
		expect(result.feeTotalCents).toBe(195);
	});

	it("calculates order fees from merchant subtotal without fee-on-fee", () => {
		const result = calculatePlatformFees(
			[
				fee({ applicationScope: "product", id: "product", value: 500 }),
				fee({ applicationScope: "order", id: "order", value: 200 }),
			],
			[
				{ key: "a", quantity: 2, unitPrice: 1_000 },
				{ key: "b", quantity: 1, unitPrice: 500 },
			],
		);
		expect(result.fees.map(item => item.amountCents)).toEqual([125, 50]);
	});

	it("rounds percentage to nearest cent per product unit", () => {
		const result = calculatePlatformFees([fee({ id: "round", value: 333 })], [
			{ key: "line", quantity: 2, unitPrice: 101 },
		]);
		expect(result.feeTotalCents).toBe(6);
	});
});
