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

export interface CalculatedFee extends EffectiveFeeReturn {
	amountCents: number;
	items: CalculatedItemFee[];
}

function feeAmount(cents: number, fee: EffectiveFeeReturn) {
	return Math.floor((cents * fee.percentageValue + 5_000) / 10_000) + fee.fixedValue;
}

export function calculatePlatformFees(
	fees: EffectiveFeeReturn[],
	items: FeeItemInput[],
): { feeTotalCents: number; fees: CalculatedFee[] } {
	const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
	const calculated = fees.map(fee => {
		if (fee.applicationScope === "order") {
			const amountCents = feeAmount(subtotal, fee);
			return { ...fee, amountCents, items: [] };
		}
		const feeItems = items.map(item => {
			const unitAmountCents = feeAmount(item.unitPrice, fee);
			return {
				amountCents: unitAmountCents * item.quantity,
				itemKey: item.key,
				unitAmountCents,
			};
		});
		return {
			...fee,
			amountCents: feeItems.reduce((sum, item) => sum + item.amountCents, 0),
			items: feeItems,
		};
	});
	return {
		fees: calculated,
		feeTotalCents: calculated.reduce((sum, fee) => sum + fee.amountCents, 0),
	};
}
