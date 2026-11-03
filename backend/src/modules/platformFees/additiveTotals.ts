import type { SimpayAdditiveTotals } from "@/shared/infra/simpay";
import type { EffectiveFeeReturn } from "./dtos";

export const SYNTHETIC_FEE_PREFIX = "additive-total:";

export const emptyTotals = (): SimpayAdditiveTotals => ({
	order: { fixedValue: 0, percentageValue: 0 },
	product: { fixedValue: 0, percentageValue: 0 },
});

export const isSyntheticFee = (id: string) => id.startsWith(SYNTHETIC_FEE_PREFIX);

/** Sums resolved fees per scope; this is all SimIntPay stores. */
export function sumAdditiveTotals(
	fees: Pick<EffectiveFeeReturn, "applicationScope" | "fixedValue" | "percentageValue">[],
): SimpayAdditiveTotals {
	const totals = emptyTotals();
	for (const fee of fees) {
		const scope = fee.applicationScope === "product" ? totals.product : totals.order;
		scope.fixedValue += fee.fixedValue;
		scope.percentageValue += fee.percentageValue;
	}
	return totals;
}

export function sameTotals(a: SimpayAdditiveTotals | undefined, b: SimpayAdditiveTotals) {
	return (["order", "product"] as const).every(
		scope => a?.[scope].fixedValue === b[scope].fixedValue && a?.[scope].percentageValue === b[scope].percentageValue,
	);
}

/** Real fees behind a synthetic one, only when they add up to exactly its rates (else SimIntPay overrode them). */
function componentsOf(
	local: EffectiveFeeReturn[],
	scope: string,
	filter: (fee: EffectiveFeeReturn) => boolean,
	rates: { fixedValue: number; percentageValue: number },
): Pick<EffectiveFeeReturn, "components"> {
	const matching = local.filter(fee => fee.applicationScope === scope && filter(fee));
	const fixedValue = matching.reduce((sum, fee) => sum + fee.fixedValue, 0);
	const percentageValue = matching.reduce((sum, fee) => sum + fee.percentageValue, 0);
	if (matching.length === 0 || fixedValue !== rates.fixedValue || percentageValue !== rates.percentageValue) return {};
	return { components: matching.map(({ fixedValue, name, percentageValue }) => ({ fixedValue, name, percentageValue })) };
}

/**
 * Buyer surcharges as SimIntPay recomputes them: one synthetic fee per non-zero scope, so rounding matches
 * `calculatePlatformFees` (order: once on the subtotal; product: per unit, times quantity).
 * Product fees stay embedded only when every real product fee was embedded.
 */
export function syntheticFees(
	totals: SimpayAdditiveTotals,
	productDisplayMode: EffectiveFeeReturn["displayMode"] = "product_explicit",
	checkoutOnlyProduct: SimpayAdditiveTotals["product"] = { fixedValue: 0, percentageValue: 0 },
	local: EffectiveFeeReturn[] = [],
): EffectiveFeeReturn[] {
	const fees: EffectiveFeeReturn[] = [];
	if (totals.order.percentageValue > 0 || totals.order.fixedValue > 0) {
		fees.push({ applicationScope: "order", displayMode: "checkout_only", id: `${SYNTHETIC_FEE_PREFIX}order`, name: "Taxa", ...totals.order, ...componentsOf(local, "order", () => true, totals.order) });
	}
	// Checkout-only product fees must not show on the product card; they are split out of SimIntPay's product total.
	const checkoutFixed = Math.min(checkoutOnlyProduct.fixedValue, totals.product.fixedValue);
	const checkoutPercentage = Math.min(checkoutOnlyProduct.percentageValue, totals.product.percentageValue);
	const visible = { fixedValue: totals.product.fixedValue - checkoutFixed, percentageValue: totals.product.percentageValue - checkoutPercentage };
	if (visible.percentageValue > 0 || visible.fixedValue > 0) {
		fees.push({ applicationScope: "product", displayMode: productDisplayMode, id: `${SYNTHETIC_FEE_PREFIX}product`, name: "Taxa", ...visible, ...componentsOf(local, "product", fee => fee.displayMode !== "checkout_only", visible) });
	}
	if (checkoutPercentage > 0 || checkoutFixed > 0) {
		fees.push({ applicationScope: "product", displayMode: "checkout_only", fixedValue: checkoutFixed, id: `${SYNTHETIC_FEE_PREFIX}product-checkout`, name: "Taxa", percentageValue: checkoutPercentage, ...componentsOf(local, "product", fee => fee.displayMode === "checkout_only", { fixedValue: checkoutFixed, percentageValue: checkoutPercentage }) });
	}
	return fees;
}

/** Display mode of the product-visible fees; checkout-only ones never appear on the product. */
export function productDisplayModeOf(fees: Pick<EffectiveFeeReturn, "applicationScope" | "displayMode">[]) {
	const product = fees.filter(fee => fee.applicationScope === "product" && fee.displayMode !== "checkout_only");
	return product.length > 0 && product.every(fee => fee.displayMode === "embedded") ? "embedded" : "product_explicit";
}

export function checkoutOnlyProductTotals(fees: Pick<EffectiveFeeReturn, "applicationScope" | "displayMode" | "fixedValue" | "percentageValue">[]) {
	return sumAdditiveTotals(fees.filter(fee => fee.applicationScope === "product" && fee.displayMode === "checkout_only")).product;
}
