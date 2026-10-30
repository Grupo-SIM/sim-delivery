export interface ProductFee {
	applicationScope: "order" | "product";
	displayMode: "checkout_only" | "embedded" | "product_explicit";
	fixedValue: number;
	id: string;
	name: string;
	percentageValue: number;
}

interface ApiFee {
	applicationScope: string;
	displayMode: string;
	fixedValue: number | string;
	id: string;
	name: string;
	percentageValue: number | string;
}

export function normalizeProductFees(fees: ApiFee[] | undefined): ProductFee[] {
	return (fees ?? []).flatMap(fee => {
		if (
			!(["order", "product"] as string[]).includes(fee.applicationScope) ||
			!(["checkout_only", "embedded", "product_explicit"] as string[]).includes(fee.displayMode)
		) return [];
		return [{
			...fee,
			applicationScope: fee.applicationScope as ProductFee["applicationScope"],
			displayMode: fee.displayMode as ProductFee["displayMode"],
			fixedValue: Number(fee.fixedValue),
			percentageValue: Number(fee.percentageValue),
		}];
	});
}

export function feeUnitAmount(priceCents: number, fee: ProductFee) {
	return Math.floor((priceCents * Number(fee.percentageValue) + 5_000) / 10_000) + Number(fee.fixedValue);
}

/** Formats a fee as "4,00%", "R$ 1,00" or "4,00% + R$ 1,00". */
export function formatFeeAmount(percentageValue: number | string, fixedValue: number | string) {
	const parts = [];
	if (Number(percentageValue) > 0) {
		parts.push(`${(Number(percentageValue) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%`);
	}
	if (Number(fixedValue) > 0) {
		parts.push((Number(fixedValue) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" }));
	}
	return parts.join(" + ") || "—";
}

export function embeddedUnitFees(priceCents: number, fees: ApiFee[] | undefined) {
	return normalizeProductFees(fees)
		.filter(fee => fee.applicationScope === "product" && fee.displayMode === "embedded")
		.reduce((sum, fee) => sum + feeUnitAmount(priceCents, fee), 0);
}

export function displayedUnitPrice(priceCents: number, fees: ApiFee[] | undefined) {
	return priceCents + embeddedUnitFees(priceCents, fees);
}

export function explicitUnitFees(priceCents: number, fees: ApiFee[] | undefined) {
	return normalizeProductFees(fees)
		.filter(fee => fee.applicationScope === "product" && fee.displayMode === "product_explicit")
		.reduce((sum, fee) => sum + feeUnitAmount(priceCents, fee), 0);
}
