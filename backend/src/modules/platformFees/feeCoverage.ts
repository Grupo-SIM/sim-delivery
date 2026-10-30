import type { EffectiveFeeReturn } from "./dtos";

export const PLATFORM_FEE_MODES = ["SIMINTPAY_ONLY", "ADDITIVE_ONLY", "BOTH"] as const;
export type PlatformFeeMode = (typeof PLATFORM_FEE_MODES)[number];

export interface FeeComponents {
	fixedCents: number;
	ratePpm: number;
}

export interface LaneId {
	installments: number;
	method: string;
}

export interface CoverageLane extends LaneId {
	/** What SimIntPay pays the acquirer. */
	cost: FeeComponents;
	/** What the company is charged to cover it, after applying the fee mode. */
	covered: FeeComponents;
	fixedShortfallCents: number;
	rateShortfallPpm: number;
}

/** Surcharges stack without compounding, so their components simply add up (basis points -> ppm). */
export function surchargeComponents(fees: Pick<EffectiveFeeReturn, "fixedValue" | "percentageValue">[]): FeeComponents {
	return {
		fixedCents: fees.reduce((sum, fee) => sum + fee.fixedValue, 0),
		ratePpm: fees.reduce((sum, fee) => sum + fee.percentageValue * 100, 0),
	};
}

/**
 * Compares fees charged for each lane against the global acquirer cost. Percentage and fixed parts are checked
 * independently, which is conservative: a higher fixed part never hides a lower percentage.
 */
export function evaluateCoverage(input: {
	costs: (FeeComponents & LaneId)[];
	mode: PlatformFeeMode;
	simintpay: (FeeComponents & LaneId)[];
	surcharges: FeeComponents;
}): CoverageLane[] {
	return input.costs.map(cost => {
		const sim = input.simintpay.find(lane => lane.method === cost.method && lane.installments === cost.installments);
		const simPart = input.mode === "ADDITIVE_ONLY" ? { fixedCents: 0, ratePpm: 0 } : (sim ?? { fixedCents: 0, ratePpm: 0 });
		const extraPart = input.mode === "SIMINTPAY_ONLY" ? { fixedCents: 0, ratePpm: 0 } : input.surcharges;
		const covered = { fixedCents: simPart.fixedCents + extraPart.fixedCents, ratePpm: simPart.ratePpm + extraPart.ratePpm };
		return {
			cost: { fixedCents: cost.fixedCents, ratePpm: cost.ratePpm },
			covered,
			fixedShortfallCents: Math.max(0, cost.fixedCents - covered.fixedCents),
			installments: cost.installments,
			method: cost.method,
			rateShortfallPpm: Math.max(0, cost.ratePpm - covered.ratePpm),
		};
	});
}

export function hasShortfall(lanes: CoverageLane[]) {
	return lanes.some(lane => lane.fixedShortfallCents > 0 || lane.rateShortfallPpm > 0);
}
