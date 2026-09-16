import { describe, expect, it } from "bun:test";
import { getCartSuggestions, hasBasePrice, hasEffectiveOptions } from "./CartSuggestions";
import type { MenuItem, MenuSection } from "./types";

function makeItem(id: string, cashbackPercent: number | null = null): MenuItem {
	return {
		cashbackPercent,
		description: "",
		featuredRank: null,
		fromPriceCents: 1000,
		id,
		imageUrl: "",
		optionGroups: [],
		popularity: 0,
		priceCents: 1000,
		productFees: [],
		productId: `product-${id}`,
		productSlug: id,
		ratingAverage: null,
		ratingCount: 0,
		regularPriceCents: 1000,
		tags: [],
		title: id,
	};
}

function makeSection(items: MenuItem[]): MenuSection {
	return { categoryId: "category", categoryName: "Categoria", items } as MenuSection;
}

describe("getCartSuggestions", () => {
	it("excludes cart items, prioritizes cashback and preserves menu order inside each tier", () => {
		const sections = [
			makeSection([
				makeItem("regular-1"),
				makeItem("cashback-1", 5),
				makeItem("regular-2"),
				makeItem("cashback-2", 10),
			]),
		];

		expect(getCartSuggestions(sections, ["regular-1"]).map(item => item.id)).toEqual([
			"cashback-1",
			"cashback-2",
			"regular-2",
		]);
	});

	it("limits suggestions to six products", () => {
		const items = Array.from({ length: 8 }, (_, index) => makeItem(`item-${index}`));

		expect(getCartSuggestions([makeSection(items)], [])).toHaveLength(6);
	});
});

describe("hasEffectiveOptions", () => {
	it("opens customization only when an option is actually available", () => {
		const group = {
			allowRepeatSelection: false,
			id: "group",
			maxSelect: 1,
			name: "Grupo",
			priceRule: "sum",
			required: false,
			sortOrder: 0,
		};
		const emptyGroup: MenuItem = { ...makeItem("empty"), optionGroups: [{ ...group, options: [] }] };
		const selectableGroup = {
			...makeItem("selectable"),
			optionGroups: [
				{
					...group,
					options: [
						{
							description: "",
							id: "option",
							imageUrl: null,
							maxPerItem: 1,
							name: "Opção",
							popularity: 0,
							priceDeltaCents: 0,
						},
					],
				},
			],
		};

		expect(hasEffectiveOptions(emptyGroup)).toBe(false);
		expect(hasEffectiveOptions(selectableGroup)).toBe(true);
	});
});

describe("hasBasePrice", () => {
	it("does not display a price when the product has no base value", () => {
		expect(hasBasePrice(makeItem("customizable", 0))).toBe(true);
		expect(hasBasePrice({ ...makeItem("composed"), priceCents: 0 })).toBe(false);
	});
});
