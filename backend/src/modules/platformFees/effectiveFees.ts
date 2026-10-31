import type { SimpayCompanyAdditiveFee } from "@/shared/infra/simpay";
import type { EffectiveFeeReturn } from "./dtos";
import { getCompanyFeeSettings } from "./companyFeeMode";

/** Active associated SimIntPay additive fees with the company's overrides applied. */
export function toEffectiveFees(fees: SimpayCompanyAdditiveFee[]): EffectiveFeeReturn[] {
	return fees
		.filter(fee => fee.active && fee.associated)
		.map(fee => ({
			applicationScope: fee.applicationScope,
			displayMode: fee.displayMode,
			fixedValue: fee.effectiveFixedValue,
			id: fee.id,
			name: fee.name,
			percentageValue: fee.effectivePercentageValue,
		}));
}

/** Surcharges charged to buyers; `SIMINTPAY_ONLY` mode leaves cost recovery entirely to SimIntPay's own fees. */
export async function listEffectiveFees(companyId: string): Promise<EffectiveFeeReturn[]> {
	const { additiveFees, mode } = await getCompanyFeeSettings(companyId);
	return mode === "SIMINTPAY_ONLY" ? [] : toEffectiveFees(additiveFees);
}
