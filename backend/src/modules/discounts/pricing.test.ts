import { describe, expect, it } from "bun:test";
import { type DiscountRule, resolveDiscountedPrice } from "./pricing";

const now = new Date("2026-06-01T12:00:00Z");
const target = { categoryIds: ["c1"], productId: "p1", tagIds: ["t1"], unitId: "u1" };

function rule(overrides: Partial<DiscountRule>): DiscountRule {
	return {
		active: true,
		categoryIds: [],
		endsAt: null,
		id: "d1",
		kind: "real",
		productIds: [],
		startsAt: null,
		tagIds: [],
		type: "percent",
		unitIds: [],
		value: 10,
		...overrides,
	};
}

describe("resolveDiscountedPrice", () => {
	it("applies a real percent discount to the charged price", () => {
		expect(resolveDiscountedPrice([rule({})], target, 1000, now)).toEqual({
			discountId: "d1",
			priceCents: 900,
			regularPriceCents: 1000,
		});
	});

	it("clamps a real fixed discount at zero", () => {
		const result = resolveDiscountedPrice([rule({ type: "fixed", value: 5000 })], target, 1000, now);
		expect(result.priceCents).toBe(0);
	});

	it("fake discount keeps the charged price and inflates the struck price", () => {
		expect(resolveDiscountedPrice([rule({ kind: "fake", value: 20 })], target, 800, now)).toEqual({
			discountId: "d1",
			priceCents: 800,
			regularPriceCents: 1000,
		});
		expect(resolveDiscountedPrice([rule({ kind: "fake", type: "fixed", value: 300 })], target, 800, now))
			.toMatchObject({ priceCents: 800, regularPriceCents: 1100 });
	});

	it("prefers the best real discount over a fake one", () => {
		const result = resolveDiscountedPrice(
			[rule({ id: "fake", kind: "fake", value: 50 }), rule({ id: "a", value: 10 }), rule({ id: "b", value: 30 })],
			target,
			1000,
			now,
		);
		expect(result).toMatchObject({ discountId: "b", priceCents: 700 });
	});

	it("matches by product or tag, and by unit", () => {
		expect(resolveDiscountedPrice([rule({ productIds: ["p9"] })], target, 1000, now).discountId).toBeNull();
		expect(resolveDiscountedPrice([rule({ productIds: ["p1"] })], target, 1000, now).discountId).toBe("d1");
		expect(resolveDiscountedPrice([rule({ tagIds: ["t1"] })], target, 1000, now).discountId).toBe("d1");
		expect(resolveDiscountedPrice([rule({ tagIds: ["t2"] })], target, 1000, now).discountId).toBeNull();
		expect(resolveDiscountedPrice([rule({ categoryIds: ["c1"] })], target, 1000, now).discountId).toBe("d1");
		expect(resolveDiscountedPrice([rule({ categoryIds: ["c2"] })], target, 1000, now).discountId).toBeNull();
		expect(
			resolveDiscountedPrice([rule({ categoryIds: ["c2"], productIds: ["p1"] })], target, 1000, now).discountId,
		).toBe("d1");
		expect(resolveDiscountedPrice([rule({ unitIds: ["u2"] })], target, 1000, now).discountId).toBeNull();
		expect(
			resolveDiscountedPrice([rule({ tagIds: ["t1"], unitIds: ["u1"] })], target, 1000, now).discountId,
		).toBe("d1");
	});

	it("ignores inactive, not-yet-started and expired discounts", () => {
		const cases = [
			rule({ active: false }),
			rule({ startsAt: new Date("2026-07-01T00:00:00Z") }),
			rule({ endsAt: new Date("2026-05-01T00:00:00Z") }),
		];
		for (const discount of cases) {
			expect(resolveDiscountedPrice([discount], target, 1000, now).priceCents).toBe(1000);
		}
	});
});
