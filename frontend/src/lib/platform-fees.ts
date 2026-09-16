export interface ProductFee {
	applicationScope: "order" | "product";
	calculationType: "fixed" | "percentage";
	displayMode: "checkout_only" | "embedded" | "product_explicit";
	id: string;
	name: string;
	value: number;
}

interface ApiFee {
	applicationScope: string;
	calculationType: string;
	displayMode: string;
	id: string;
	name: string;
	value: number | string;
}

export function normalizeProductFees(fees: ApiFee[] | undefined): ProductFee[] {
	return (fees ?? []).flatMap(fee => {
		if (
			!(["order", "product"] as string[]).includes(fee.applicationScope) ||
			!(["fixed", "percentage"] as string[]).includes(fee.calculationType) ||
			!(["checkout_only", "embedded", "product_explicit"] as string[]).includes(fee.displayMode)
		) return [];
		return [{
			...fee,
			applicationScope: fee.applicationScope as ProductFee["applicationScope"],
			calculationType: fee.calculationType as ProductFee["calculationType"],
			displayMode: fee.displayMode as ProductFee["displayMode"],
			value: Number(fee.value),
		}];
	});
}

export function feeUnitAmount(priceCents: number, fee: ProductFee) {
	return fee.calculationType === "fixed"
		? Number(fee.value)
		: Math.floor((priceCents * Number(fee.value) + 5_000) / 10_000);
}

export function embeddedUnitFees(priceCents: number, fees: ApiFee[] | undefined) {
	return normalizeProductFees(fees)
		.filter(fee => fee.applicationScope === "product" && fee.displayMode === "embedded")
		.reduce((sum, fee) => sum + feeUnitAmount(priceCents, fee), 0);
}

export function displayedUnitPrice(priceCents: number, fees: ApiFee[] | undefined) {
	return priceCents + embeddedUnitFees(priceCents, fees);
}
