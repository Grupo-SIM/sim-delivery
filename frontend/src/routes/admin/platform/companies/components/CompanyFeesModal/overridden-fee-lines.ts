import type { CompanyFees } from "./types";

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
