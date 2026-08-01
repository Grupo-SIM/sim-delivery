import { describe, expect, it } from "bun:test";
import type { SelectedOption } from "@/stores";
import {
	applyOptionQuantity,
	findInvalidGroup,
	groupQuantity,
	hasPriceVariation,
	isGroupComplete,
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
		allowRepeatSelection: false,
		maxSelect: 1,
		name: `Grupo ${overrides.id}`,
		options: [],
		priceRule: "sum",
		required: false,
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
		const groups = [makeGroup({ allowRepeatSelection: true, id: "g1", maxSelect: 3, priceRule: "sum" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 500 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(800);
	});

	it("charges each unit when an option is chosen more than once", () => {
		const groups = [makeGroup({ allowRepeatSelection: true, id: "g1", maxSelect: 3, priceRule: "sum" })];
		const selection = [makeSelection({ optionId: "o1", priceDeltaCents: 300, quantity: 3 })];

		expect(optionsPriceDelta(groups, selection)).toBe(900);
	});

	it("charges only the dearest pick under the highest rule", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, priceRule: "highest" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 900 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(900);
	});

	it("charges the mean under the average rule", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, priceRule: "average" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 300 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 900 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(600);
	});

	it("rounds the average to whole cents", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 3, priceRule: "average" })];
		const selection = [
			makeSelection({ optionId: "o1", priceDeltaCents: 100 }),
			makeSelection({ optionId: "o2", priceDeltaCents: 100 }),
			makeSelection({ optionId: "o3", priceDeltaCents: 101 }),
		];

		expect(optionsPriceDelta(groups, selection)).toBe(100);
	});

	it("applies each group's rule independently", () => {
		const groups = [
			makeGroup({ id: "g1", maxSelect: 2, priceRule: "highest" }),
			makeGroup({ id: "g2", maxSelect: 2, priceRule: "sum" }),
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
		optionGroups: [makeGroup({ id: "g1", maxSelect: 2, priceRule: "sum" })],
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

describe("hasPriceVariation", () => {
	it("is false for an empty group", () => {
		expect(hasPriceVariation([makeGroup({ id: "g1" })])).toBe(false);
	});

	it("is true for an optional group with varying prices", () => {
		const group = makeGroup({
			id: "g1",
			options: [makeOption({ id: "o1", priceDeltaCents: 0 }), makeOption({ id: "o2", priceDeltaCents: 200 })],
			required: false,
		});

		expect(hasPriceVariation([group])).toBe(true);
	});

	it("is true for a required unlimited (null maxSelect) sum group with priced options", () => {
		const group = makeGroup({
			id: "g1",
			maxSelect: null,
			options: [makeOption({ id: "o1", priceDeltaCents: 200 })],
			priceRule: "sum",
			required: true,
		});

		expect(hasPriceVariation([group])).toBe(true);
	});

	it("is false for a required max-1 group whose options share the same price", () => {
		const group = makeGroup({
			id: "g1",
			maxSelect: 1,
			options: [makeOption({ id: "o1", priceDeltaCents: 200 }), makeOption({ id: "o2", priceDeltaCents: 200 })],
			required: true,
		});

		expect(hasPriceVariation([group])).toBe(false);
	});
});

describe("isGroupComplete", () => {
	it("completes an unlimited group as soon as one option is picked", () => {
		const group = makeGroup({ id: "g1", maxSelect: null });

		expect(isGroupComplete(group, [])).toBe(false);
		expect(isGroupComplete(group, [makeSelection({ optionId: "o1" })])).toBe(true);
	});

	it("completes a max-1 group as soon as one option is picked", () => {
		const group = makeGroup({ id: "g1", maxSelect: 1 });

		expect(isGroupComplete(group, [makeSelection({ optionId: "o1" })])).toBe(true);
	});

	it("only completes a capped group once the cap is reached", () => {
		const group = makeGroup({ id: "g1", maxSelect: 3 });

		expect(isGroupComplete(group, [makeSelection({ optionId: "o1", quantity: 2 })])).toBe(false);
		expect(isGroupComplete(group, [makeSelection({ optionId: "o1", quantity: 3 })])).toBe(true);
	});
});

describe("findInvalidGroup", () => {
	it("accepts a selection inside the limits", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, required: true })];

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
		const groups = [makeGroup({ id: "g1", maxSelect: 1, required: false })];

		expect(findInvalidGroup(groups, [makeSelection({ optionId: "o1", quantity: 2 })])?.id).toBe("g1");
	});

	it("counts repeats of one option against the group maximum", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: 2, required: false })];

		expect(findInvalidGroup(groups, [makeSelection({ optionId: "o1", quantity: 3 })])?.id).toBe("g1");
	});

	it("never flags an unlimited (null maxSelect) group for having too many picks", () => {
		const groups = [makeGroup({ id: "g1", maxSelect: null, required: false })];

		expect(findInvalidGroup(groups, [makeSelection({ optionId: "o1", quantity: 50 })])).toBeUndefined();
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
	describe("max-1 groups (radio behavior)", () => {
		const group = makeGroup({ id: "g1", maxSelect: 1 });

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

	describe("toggle groups (allowRepeatSelection: false)", () => {
		const group = makeGroup({ allowRepeatSelection: false, id: "g1", maxSelect: 3 });

		it("adds an option regardless of its own maxPerItem", () => {
			const option = makeOption({ id: "o1", maxPerItem: 5, priceDeltaCents: 250 });
			const result = applyOptionQuantity(group, option, 1, []);

			expect(result).toEqual([
				{
					groupId: "g1",
					groupName: "Grupo g1",
					optionId: "o1",
					optionName: "Opção o1",
					priceDeltaCents: 250,
					quantity: 1,
				},
			]);
		});

		it("refuses to pick the same option twice even with a high maxPerItem", () => {
			const current = [makeSelection({ optionId: "o1", quantity: 1 })];
			const option = makeOption({ id: "o1", maxPerItem: 5 });

			expect(applyOptionQuantity(group, option, 2, current)).toBe(current);
		});

		it("removes the option at quantity zero", () => {
			const current = [makeSelection({ optionId: "o1" }), makeSelection({ optionId: "o2" })];
			const result = applyOptionQuantity(group, makeOption({ id: "o1" }), 0, current);

			expect(result.map(option => option.optionId)).toEqual(["o2"]);
		});

		it("refuses another distinct option once the group cap is reached", () => {
			const current = [
				makeSelection({ optionId: "o1" }),
				makeSelection({ optionId: "o2" }),
				makeSelection({ optionId: "o3" }),
			];

			expect(applyOptionQuantity(group, makeOption({ id: "o4" }), 1, current)).toBe(current);
		});

		it("has no group cap when maxSelect is null", () => {
			const unlimited = makeGroup({ allowRepeatSelection: false, id: "g1", maxSelect: null });
			const current = Array.from({ length: 10 }, (_, index) =>
				makeSelection({ optionId: `o${index}` }),
			);

			const result = applyOptionQuantity(unlimited, makeOption({ id: "o10" }), 1, current);

			expect(result).toHaveLength(11);
		});
	});

	describe("repeat-enabled groups (allowRepeatSelection: true)", () => {
		const group = makeGroup({ allowRepeatSelection: true, id: "g1", maxSelect: 3 });

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

		it("has no per-option cap when the option's maxPerItem and the group maxSelect are both null", () => {
			const unlimited = makeGroup({ allowRepeatSelection: true, id: "g1", maxSelect: null });
			const result = applyOptionQuantity(unlimited, makeOption({ id: "o1", maxPerItem: null }), 20, []);

			expect(result[0].quantity).toBe(20);
		});
	});
});
