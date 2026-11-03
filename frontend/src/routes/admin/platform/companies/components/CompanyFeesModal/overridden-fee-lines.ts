import { centsToReais, percentToBasisPoints, ppmToPercent, reaisToCents, type CompanyFees } from "./types";

export type OverriddenScope = "order" | "product";

export interface OverriddenFeeLine {
	fixedCents: number;
	percentageBasisPoints: number;
	scope: OverriddenScope;
}

/** One nameless line per non-zero scope of the total a SimIntPay admin set; empty when no override is active. */
export function overriddenFeeLines(additiveOverride: CompanyFees["additiveOverride"]): OverriddenFeeLine[] {
	if (!additiveOverride) return [];
	return (["order", "product"] as const).flatMap(scope => {
		const total = additiveOverride[scope];
		if (!total.percentageValue && !total.fixedValue) return [];
		return [{ fixedCents: Number(total.fixedValue), percentageBasisPoints: Number(total.percentageValue), scope }];
	});
}

/** Surcharge applied to the seller's lanes: the override while active, otherwise the live associated fees. */
export function overriddenSurcharge(additiveOverride: CompanyFees["additiveOverride"]) {
	const lines = overriddenFeeLines(additiveOverride);
	return {
		fixedCents: lines.reduce((sum, line) => sum + line.fixedCents, 0),
		ratePpm: lines.reduce((sum, line) => sum + line.percentageBasisPoints * 100, 0),
	};
}

export const OVERRIDDEN_SCOPES = ["order", "product"] as const;

export type OverrideDraft = Record<OverriddenScope, { fixed: string; percentage: string }>;

export function initialOverrideDraft(additiveOverride: CompanyFees["additiveOverride"]): OverrideDraft {
	const draftOf = (scope: OverriddenScope) => ({
		fixed: centsToReais(additiveOverride?.[scope].fixedValue ?? 0),
		percentage: ppmToPercent(Number(additiveOverride?.[scope].percentageValue ?? 0) * 100),
	});
	return { order: draftOf("order"), product: draftOf("product") };
}

/** Totals for the update body; empty fields mean zero. */
export function overrideDraftTotals(draft: OverrideDraft) {
	const totalOf = (scope: OverriddenScope) => ({
		fixedValue: reaisToCents(draft[scope].fixed || "0"),
		percentageValue: percentToBasisPoints(draft[scope].percentage) ?? 0,
	});
	return { order: totalOf("order"), product: totalOf("product") };
}

/** Surcharge of the edited override draft. */
export function overrideDraftSurcharge(draft: OverrideDraft) {
	const totals = overrideDraftTotals(draft);
	return {
		fixedCents: totals.order.fixedValue + totals.product.fixedValue,
		ratePpm: (totals.order.percentageValue + totals.product.percentageValue) * 100,
	};
}
