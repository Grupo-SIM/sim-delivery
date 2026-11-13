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

/** A rule that targets the test product. */
function hit(overrides: Partial<DiscountRule> = {}): DiscountRule {
	return rule({ productIds: ["p1"], ...overrides });
}

describe("resolveDiscountedPrice", () => {
	it("applies a real percent discount to the charged price", () => {
		expect(resolveDiscountedPrice([hit({})], target, 1000, now)).toEqual({
			discountId: "d1",
			priceCents: 900,
			regularPriceCents: 1000,
		});
	});

	it("clamps a real fixed discount at zero", () => {
		const result = resolveDiscountedPrice([hit({ type: "fixed", value: 5000 })], target, 1000, now);
		expect(result.priceCents).toBe(0);
	});

	it("fake discount keeps the charged price and inflates the struck price", () => {
		expect(resolveDiscountedPrice([hit({ kind: "fake", value: 20 })], target, 800, now)).toEqual({
			discountId: "d1",
			priceCents: 800,
			regularPriceCents: 1000,
		});
		expect(resolveDiscountedPrice([hit({ kind: "fake", type: "fixed", value: 300 })], target, 800, now))
			.toMatchObject({ priceCents: 800, regularPriceCents: 1100 });
	});

	it("prefers the best real discount over a fake one", () => {
		const result = resolveDiscountedPrice(
			[hit({ id: "fake", kind: "fake", value: 50 }), hit({ id: "a", value: 10 }), hit({ id: "b", value: 30 })],
			target,
			1000,
			now,
		);
		expect(result).toMatchObject({ discountId: "b", priceCents: 700 });
	});

	it("matches nothing when no product, category or tag is selected", () => {
		expect(resolveDiscountedPrice([rule({})], target, 1000, now).discountId).toBeNull();
		expect(resolveDiscountedPrice([rule({ unitIds: ["u1"] })], target, 1000, now).discountId).toBeNull();
	});

	it("matches by product, category or tag (union), and restricts by unit", () => {
		const id = (discount: DiscountRule) => resolveDiscountedPrice([discount], target, 1000, now).discountId;
		expect(id(rule({ productIds: ["p9"] }))).toBeNull();
		expect(id(rule({ productIds: ["p1"] }))).toBe("d1");
		expect(id(rule({ tagIds: ["t1"] }))).toBe("d1");
		expect(id(rule({ tagIds: ["t2"] }))).toBeNull();
		expect(id(rule({ categoryIds: ["c1"] }))).toBe("d1");
		expect(id(rule({ categoryIds: ["c2"] }))).toBeNull();
		expect(id(rule({ categoryIds: ["c2"], productIds: ["p1"] }))).toBe("d1");
		expect(id(rule({ tagIds: ["t1"], unitIds: ["u2"] }))).toBeNull();
		expect(id(rule({ tagIds: ["t1"], unitIds: ["u1"] }))).toBe("d1");
	});

	it("ignores inactive, not-yet-started and expired discounts", () => {
		const cases = [
			hit({ active: false }),
			hit({ startsAt: new Date("2026-07-01T00:00:00Z") }),
			hit({ endsAt: new Date("2026-05-01T00:00:00Z") }),
		];
		for (const discount of cases) {
			expect(resolveDiscountedPrice([discount], target, 1000, now).priceCents).toBe(1000);
		}
	});
});
