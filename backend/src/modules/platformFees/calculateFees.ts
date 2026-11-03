import type { EffectiveFeeReturn } from "./dtos";

export interface FeeItemInput {
	key: string;
	quantity: number;
	unitPrice: number;
}

export interface CalculatedItemFee {
	amountCents: number;
	itemKey: string;
	unitAmountCents: number;
}

export interface CalculatedFee extends Omit<EffectiveFeeReturn, "components"> {
	amountCents: number;
	/** Display-only split of `amountCents`; the last component absorbs rounding. */
	components?: { amountCents: number; name: string }[];
	items: CalculatedItemFee[];
}

function feeAmount(cents: number, fee: EffectiveFeeReturn) {
	return Math.floor((cents * fee.percentageValue + 5_000) / 10_000) + fee.fixedValue;
}

function splitComponents(fee: EffectiveFeeReturn, items: FeeItemInput[], subtotal: number, amountCents: number) {
	if (!fee.components) return undefined;
	const amounts = fee.components.map(component =>
		fee.applicationScope === "order"
			? feeAmount(subtotal, component)
			: items.reduce((sum, item) => sum + feeAmount(item.unitPrice, component) * item.quantity, 0),
	);
	const rest = amountCents - amounts.slice(0, -1).reduce((sum, amount) => sum + amount, 0);
	return fee.components.map((component, index) => ({ amountCents: index === amounts.length - 1 ? rest : amounts[index], name: component.name }));
}

export function calculatePlatformFees(
	fees: EffectiveFeeReturn[],
	items: FeeItemInput[],
): { feeTotalCents: number; fees: CalculatedFee[] } {
	const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
	const calculated = fees.map(fee => {
		if (fee.applicationScope === "order") {
			const amountCents = feeAmount(subtotal, fee);
			return { ...fee, amountCents, components: splitComponents(fee, items, subtotal, amountCents), items: [] };
		}
		const feeItems = items.map(item => {
			const unitAmountCents = feeAmount(item.unitPrice, fee);
			return {
				amountCents: unitAmountCents * item.quantity,
				itemKey: item.key,
				unitAmountCents,
			};
		});
		const amountCents = feeItems.reduce((sum, item) => sum + item.amountCents, 0);
		return { ...fee, amountCents, components: splitComponents(fee, items, subtotal, amountCents), items: feeItems };
	});
	return {
		fees: calculated,
		feeTotalCents: calculated.reduce((sum, fee) => sum + fee.amountCents, 0),
	};
}
