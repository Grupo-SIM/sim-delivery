import type { PrismaInstance } from "@/shared/infra/sql";
import { SYNTHETIC_FEE_PREFIX } from "./additiveTotals";
import { calculatePlatformFees, type CalculatedFee, type FeeItemInput } from "./calculateFees";
import { listEffectiveFees } from "./effectiveFees";

/**
 * Display-only split of the additive fees SimIntPay quoted (labels, per-item embedded amounts). The quote is the only
 * charged amount: the local split is used only when it adds up to exactly the quoted cents; otherwise (SimIntPay
 * priced differently, e.g. after an override) the order keeps one checkout fee carrying the quoted amount.
 */
export async function additiveFeeBreakdown(
	prisma: PrismaInstance,
	companyId: string,
	items: FeeItemInput[],
	quotedCents: number,
): Promise<{ feeTotalCents: number; fees: CalculatedFee[] }> {
	if (quotedCents <= 0) return { feeTotalCents: 0, fees: [] };
	const local = await listEffectiveFees(prisma, companyId)
		.then(fees => calculatePlatformFees(fees, items))
		.catch(() => null);
	if (local && local.feeTotalCents === quotedCents) return local;
	return {
		feeTotalCents: quotedCents,
		fees: [{
			amountCents: quotedCents,
			applicationScope: "order",
			displayMode: "checkout_only",
			fixedValue: 0,
			id: `${SYNTHETIC_FEE_PREFIX}quote`,
			items: [],
			name: "Taxa",
			percentageValue: 0,
		}],
	};
}
