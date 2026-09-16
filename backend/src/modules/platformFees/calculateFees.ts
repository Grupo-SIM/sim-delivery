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

function percentageAmount(cents: number, basisPoints: number) {
	return Math.floor((cents * basisPoints + 5_000) / 10_000);
}

export function calculatePlatformFees(
	fees: EffectiveFeeReturn[],
	items: FeeItemInput[],
): { feeTotalCents: number; fees: CalculatedFee[] } {
	const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
	const calculated = fees.map(fee => {
		if (fee.applicationScope === "order") {
			const amountCents =
				fee.calculationType === "fixed" ? fee.value : percentageAmount(subtotal, fee.value);
			return { ...fee, amountCents, items: [] };
		}
		const feeItems = items.map(item => {
			const unitAmountCents =
				fee.calculationType === "fixed"
					? fee.value
					: percentageAmount(item.unitPrice, fee.value);
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
