import type { SelectedOption } from "@/stores";
import type { MenuItem } from "./types";

type OptionGroup = MenuItem["optionGroups"][number];
type Option = OptionGroup["options"][number];

/** Total units chosen inside one group, counting an option picked N times as N. */
export function groupQuantity(options: SelectedOption[], groupId: string): number {
	return options
		.filter(option => option.groupId === groupId)
		.reduce((sum, option) => sum + option.quantity, 0);
}

/**
 * Price added on top of the base product by the chosen options. Each group applies its own
 * rule: `highest` charges only the dearest pick, `average` charges the mean, and anything
 * else sums every pick. An option chosen N times counts N times in all three.
 */
export function optionsPriceDelta(optionGroups: OptionGroup[], options: SelectedOption[]): number {
	return optionGroups.reduce((sum, group) => {
		const prices = options
			.filter(option => option.groupId === group.id)
			.flatMap(option => Array.from({ length: option.quantity }, () => option.priceDeltaCents));

		if (prices.length === 0) return sum;
		if (group.priceRule === "highest") return sum + Math.max(...prices);
		if (group.priceRule === "average") {
			return sum + Math.round(prices.reduce((total, price) => total + price, 0) / prices.length);
		}

		return sum + prices.reduce((total, price) => total + price, 0);
	}, 0);
}

/** Line total in cents for the chosen options and quantity. */
export function lineTotal(item: MenuItem, options: SelectedOption[], quantity: number): number {
	return (Number(item.priceCents) + optionsPriceDelta(item.optionGroups, options)) * quantity;
}

/**
 * Whether any combination of option picks can change the item's total price. False when every
 * group is either empty, a required group whose max is 1 with a single option, or a required
 * group whose options all share the same price delta — in those cases the price is fixed
 * regardless of what the customer picks, so "A partir de" would be misleading.
 */
export function hasPriceVariation(optionGroups: OptionGroup[]): boolean {
	return optionGroups.some(group => {
		const prices = group.options.map(option => Number(option.priceDeltaCents));
		if (prices.length === 0) return false;

		if (!group.required) return prices.some(price => price !== 0);

		if (group.priceRule === "sum" && (group.maxSelect == null || Number(group.maxSelect) > 1)) {
			return prices.some(price => price !== 0);
		}

		return new Set(prices).size > 1;
	});
}

/**
 * Whether a group has been filled out to the point it should collapse into a summary. A group
 * with no cap (`maxSelect` null) completes as soon as one option is picked; a capped group
 * (including max 1, which behaves like a radio) completes once every selectable unit has been
 * used.
 */
export function isGroupComplete(group: OptionGroup, options: SelectedOption[]): boolean {
	const count = groupQuantity(options, group.id);

	return group.maxSelect == null ? count > 0 : count >= Number(group.maxSelect);
}

/** First group whose selection count falls outside its min/max, or undefined when all are valid. */
export function findInvalidGroup(
	optionGroups: OptionGroup[],
	options: SelectedOption[],
): OptionGroup | undefined {
	return optionGroups.find(group => {
		const count = groupQuantity(options, group.id);

		return count < (group.required ? 1 : 0) || (group.maxSelect != null && count > Number(group.maxSelect));
	});
}

/**
 * Returns the selection after setting `option` to `nextQuantity`, or the unchanged selection
 * when the change would break a limit. A group whose `maxSelect` is 1 behaves like a radio:
 * picking a new option replaces whatever was picked. Otherwise, unless `allowRepeatSelection` is
 * set, each option is a simple toggle (0 or 1); with it set, the option can be picked repeatedly
 * up to its own `maxPerItem` and the group's `maxSelect`.
 */
export function applyOptionQuantity(
	group: OptionGroup,
	option: Option,
	nextQuantity: number,
	current: SelectedOption[],
): SelectedOption[] {
	const selection: SelectedOption = {
		groupId: group.id,
		groupName: group.name,
		optionId: option.id,
		optionName: option.name,
		priceDeltaCents: Number(option.priceDeltaCents),
		quantity: nextQuantity,
	};

	if (nextQuantity < 0) return current;

	if (group.maxSelect === 1) {
		const withoutGroup = current.filter(value => value.groupId !== group.id);

		return nextQuantity === 0 ? withoutGroup : [...withoutGroup, { ...selection, quantity: 1 }];
	}

	const perOptionCap = group.allowRepeatSelection ? Number(option.maxPerItem ?? Number.POSITIVE_INFINITY) : 1;
	if (nextQuantity > perOptionCap) return current;

	const quantityFromOtherOptions = current
		.filter(value => value.groupId === group.id && value.optionId !== option.id)
		.reduce((sum, value) => sum + value.quantity, 0);
	const groupCap = group.maxSelect == null ? Number.POSITIVE_INFINITY : Number(group.maxSelect);
	if (quantityFromOtherOptions + nextQuantity > groupCap) return current;

	if (nextQuantity === 0) return current.filter(value => value.optionId !== option.id);

	return current.some(value => value.optionId === option.id)
		? current.map(value => (value.optionId === option.id ? { ...value, quantity: nextQuantity } : value))
		: [...current, selection];
}
