import { describe, expect, it } from "bun:test";
import type { SelectedOption } from "@/stores";
import {
	applyOptionQuantity,
	findInvalidGroup,
	groupQuantity,
	lineTotal,
	optionsPriceDelta,
} from "./product-options";
import type { MenuItem } from "./types";

type OptionGroup = MenuItem["optionGroups"][number];
type Option = OptionGroup["options"][number];

function makeOption(overrides: Partial<Option> & { id: string }): Option {
	return { maxPerItem: null, name: `Opção ${overrides.id}`, priceDeltaCents: 0, ...overrides } as Option;
}

function makeGroup(overrides: Partial<OptionGroup> & { id: string }): OptionGroup {
	return {
		maxSelect: 1,
		name: `Grupo ${overrides.id}`,
		options: [],
		priceRule: "sum",
		required: false,
		selectionType: "single",
		...overrides,
	} as OptionGroup;
}

function makeSelection(overrides: Partial<SelectedOption> & { optionId: string }): SelectedOption {
	return {
		groupId: "g1",
		groupName: "Grupo g1",
		optionName: `Opção ${overrides.optionId}`,
		priceDeltaCents: 0,
		quantity: 1,
		...overrides,
	};
}

describe("groupQuantity", () => {
	it("counts an option chosen several times once per unit", () => {
		const selection = [makeSelection({ optionId: "o1", quantity: 3 })];

		expect(groupQuantity(selection, "g1")).toBe(3);
	});

	it("sums every option inside the group", () => {
		const selection = [
			makeSelection({ optionId: "o1", quantity: 2 }),
			makeSelection({ optionId: "o2", quantity: 1 }),
		];

		expect(groupQuantity(selection, "g1")).toBe(3);
	});

	it("ignores options from other groups", () => {
		const selection = [
			makeSelection({ optionId: "o1", quantity: 2 }),
			makeSelection({ groupId: "g2", optionId: "o3", quantity: 5 }),
		];

		expect(groupQuantity(selection, "g1")).toBe(2);
	});

	it("is zero when nothing is chosen", () => {
		expect(groupQuantity([], "g1")).toBe(0);
	});
});

describe("optionsPriceDelta", () => {
	it("is zero when no option is chosen", () => {
		expect(optionsPriceDelta([makeGroup({ id: "g1" })], [])).toBe(0);
	});

	it("sums every chosen option by default", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 3, priceRule: "sum", selectionType: "multiple" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 500 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(800);
	});

	it("charges each unit when an option is chosen more than once", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 3, priceRule: "sum", selectionType: "multiple" })];
		const selection = [makeSelection({ optionId: "o1", priceDeltaCents: 300, quantity: 3 })];

		expect(optionsPriceDelta(groups, selection)).toBe(900);
	});

	it("charges only the dearest pick under the highest rule", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, priceRule: "highest", selectionType: "multiple" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 900 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(900);
	});

	it("charges the mean under the average rule", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, priceRule: "average", selectionType: "multiple" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 900 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(600);
	});

	it("rounds the average to whole cents", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 3, priceRule: "average", selectionType: "multiple" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 100 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 100 }),
			makeSelection({ optionId: "o3", priceDeltaCents: 101 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(100);
	});

	it("applies each group's rule independently", () => {
		const groups = [
			makeGroup({ id: "g1", maxSelect: 2, priceRule: "highest", selectionType: "multiple" }),
			makeGroup({ id: "g2", maxSelect: 2, priceRule: "sum", selectionType: "multiple" }),
		];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 900 }),
			makeSelection({ groupId: "g2", optionId: "o3", priceDeltaCents: 200 }),
			makeSelection({ groupId: "g2", optionId: "o4", priceDeltaCents: 250 }),
		];

		// highest of g1 (900) + sum of g2 (450)
		expect(optionsPriceDelta(groups, selection)).toBe(1350);
	});

	it("ignores selections whose group is gone from the menu", () => {
		const groups = [makeGroup({ id: "g1" })];
		const selection = [makeSelection({ groupId: "g_removed", optionId: "o9", priceDeltaCents: 500 })];

		expect(optionsPriceDelta(groups, selection)).toBe(0);
	});
});

describe("lineTotal", () => {
	const item = {
		optionGroups: [makeGroup({ id: "g1", maxSelect: 2, priceRule: "sum", selectionType: "multiple" })],
		priceCents: 2000,
	} as MenuItem;

	it("is the base price when nothing is chosen", () => {
		expect(lineTotal(item, [], 1)).toBe(2000);
	});

	it("adds the option delta to the base price", () => {
		expect(lineTotal(item, [makeSelection({ optionId: "o1", priceDeltaCents: 500 })], 1)).toBe(2500);
	});

	it("multiplies base plus options by the quantity", () => {
		expect(lineTotal(item, [makeSelection({ optionId: "o1", priceDeltaCents: 500 })], 3)).toBe(7500);
	});

	it("is zero for a quantity of zero", () => {
		expect(lineTotal(item, [], 0)).toBe(0);
	});
});

describe("findInvalidGroup", () => {
	it("accepts a selection inside the limits", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, required: true, selectionType: "multiple" })];

		expect(findInvalidGroup(groups, [makeSelection({ optionId: "o1" })])).toBeUndefined();
	});

	it("flags a required group left empty", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 1, required: true })];

		expect(findInvalidGroup(groups, [])?.id).toBe("g1");
	});

	it("accepts an optional group left empty", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 1, required: false })];

		expect(findInvalidGroup(groups, [])).toBeUndefined();
	});

	it("flags a group with more picks than allowed", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 1, required: false, selectionType: "multiple" })];

		expect(findInvalidGroup(groups, [makeSelection({ optionId: "o1", quantity: 2 })])?.id).toBe("g1");
	});

	it("counts repeats of one option against the group maximum", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, required: false, selectionType: "multiple" })];

		expect(findInvalidGroup(groups, [makeSelection({ optionId: "o1", quantity: 3 })])?.id).toBe("g1");
	});

	it("returns the first offending group when several are invalid", () => {
		const groups = [
			makeGroup({ id: "g1", maxSelect: 1, required: false }),
			makeGroup({ id: "g2", maxSelect: 1, required: true }),
			makeGroup({ id: "g3", maxSelect: 1, required: true }),
		];

		expect(findInvalidGroup(groups, [])?.id).toBe("g2");
	});
});

describe("applyOptionQuantity", () => {
	describe("single-choice groups", () => {
		const group = makeGroup({ id: "g1", maxSelect: 1, selectionType: "single" });

		it("selects an option", () => {
			const result = applyOptionQuantity(group, makeOption({ id: "o1", priceDeltaCents: 300 }), 1, []);

			expect(result).toEqual([
				{
					groupId: "g1",
					groupName: "Grupo g1",
					optionId: "o1",
					optionName: "Opção o1",
					priceDeltaCents: 300,
					quantity: 1,
				},
			]);
		});

		it("replaces the previous pick instead of stacking", () => {
			const current = [makeSelection({ optionId: "o1" })];
			const result = applyOptionQuantity(group, makeOption({ id: "o2" }), 1, current);

			expect(result.map(option => option.optionId)).toEqual(["o2"]);
		});

		it("deselects the option at quantity zero", () => {
			const current = [makeSelection({ optionId: "o1" })];

			expect(applyOptionQuantity(group, makeOption({ id: "o1" }), 0, current)).toEqual([]);
		});

		it("never stores a quantity above one", () => {
			const result = applyOptionQuantity(group, makeOption({ id: "o1" }), 5, []);

			expect(result[0].quantity).toBe(1);
		});

		it("leaves other groups untouched", () => {
			const current = [makeSelection({ groupId: "g2", optionId: "o9" })];
			const result = applyOptionQuantity(group, makeOption({ id: "o1" }), 1, current);

			expect(result.map(option => option.optionId).sort()).toEqual(["o1", "o9"]);
		});
	});

	describe("multi-choice groups", () => {
		const group = makeGroup({ id: "g1", maxSelect: 3, selectionType: "multiple" });

		it("adds an option with the requested quantity", () => {
			const result = applyOptionQuantity(group, makeOption({ id: "o1", priceDeltaCents: 250 }), 2, []);

			expect(result).toEqual([
				{
					groupId: "g1",
					groupName: "Grupo g1",
					optionId: "o1",
					optionName: "Opção o1",
					priceDeltaCents: 250,
					quantity: 2,
				},
			]);
		});

		it("updates the quantity of an already chosen option", () => {
			const current = [makeSelection({ optionId: "o1", quantity: 1 })];
			const result = applyOptionQuantity(group, makeOption({ id: "o1" }), 3, current);

			expect(result).toHaveLength(1);
			expect(result[0].quantity).toBe(3);
		});

		it("removes the option at quantity zero", () => {
			const current = [makeSelection({ optionId: "o1" }), makeSelection({ optionId: "o2" })];
			const result = applyOptionQuantity(group, makeOption({ id: "o1" }), 0, current);

			expect(result.map(option => option.optionId)).toEqual(["o2"]);
		});

		it("refuses a negative quantity", () => {
			const current = [makeSelection({ optionId: "o1" })];

			expect(applyOptionQuantity(group, makeOption({ id: "o1" }), -1, current)).toBe(current);
		});

		it("refuses to exceed the group maximum with one option", () => {
			const current = [makeSelection({ optionId: "o1", quantity: 3 })];

			expect(applyOptionQuantity(group, makeOption({ id: "o1" }), 4, current)).toBe(current);
		});

		it("counts sibling options against the group maximum", () => {
			const current = [
				makeSelection({ optionId: "o1", quantity: 2 }),
				makeSelection({ optionId: "o2", quantity: 1 }),
			];

			// g1 allows 3 in total and siblings already take 2, so o2 cannot reach 2.
			expect(applyOptionQuantity(group, makeOption({ id: "o2" }), 2, current)).toBe(current);
		});

		it("allows a change that exactly reaches the group maximum", () => {
			const current = [makeSelection({ optionId: "o1", quantity: 1 })];
			const result = applyOptionQuantity(group, makeOption({ id: "o2" }), 2, current);

			expect(result).toHaveLength(2);
		});

		it("does not count other groups against this group's maximum", () => {
			const current = [makeSelection({ groupId: "g2", optionId: "o9", quantity: 3 })];
			const result = applyOptionQuantity(group, makeOption({ id: "o1" }), 3, current);

			expect(result.find(option => option.optionId === "o1")?.quantity).toBe(3);
		});

		it("respects an option's own per-item cap below the group maximum", () => {
			const current: SelectedOption[] = [];
			const option = makeOption({ id: "o1", maxPerItem: 1 });

			expect(applyOptionQuantity(group, option, 2, current)).toBe(current);
			expect(applyOptionQuantity(group, option, 1, current)).toHaveLength(1);
		});

		it("falls back to the group maximum when the option has no cap", () => {
			const result = applyOptionQuantity(group, makeOption({ id: "o1", maxPerItem: null }), 3, []);

			expect(result[0].quantity).toBe(3);
		});
	});
});
