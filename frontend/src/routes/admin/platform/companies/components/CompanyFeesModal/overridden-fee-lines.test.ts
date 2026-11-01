import { describe, expect, it } from "bun:test";
import { overriddenFeeLines, overriddenSurcharge } from "./overridden-fee-lines";

const total = (percentageValue: number, fixedValue: number) => ({ fixedValue, percentageValue });

describe("overridden fee lines", () => {
	it("is empty without an override", () => {
		expect(overriddenFeeLines(null)).toEqual([]);
		expect(overriddenSurcharge(null)).toEqual({ fixedCents: 0, ratePpm: 0 });
	});

	it("lists only non-zero scopes and sums them for coverage", () => {
		const override = { order: total(600, 100), product: total(0, 0) };
		expect(overriddenFeeLines(override)).toEqual([{ fixedCents: 100, percentageBasisPoints: 600, scope: "order" }]);
		expect(overriddenSurcharge({ ...override, product: total(200, 50) })).toEqual({ fixedCents: 150, ratePpm: 80_000 });
	});
});
