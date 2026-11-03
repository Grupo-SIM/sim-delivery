import type { PrismaInstance } from "@/shared/infra/sql";
import type { EffectiveFeeReturn } from "./dtos";
import { checkoutOnlyProductTotals, productDisplayModeOf, syntheticFees } from "./additiveTotals";
import { getCompanyFeeSnapshot } from "./companyFeeMode";

/**
 * Surcharges charged to buyers, built from SimIntPay's effective totals (its admin may override Delivery's sum) as one
 * synthetic fee per scope, so SimIntPay recomputes the same cents. `SIMINTPAY_ONLY` mode leaves cost recovery entirely
 * to SimIntPay's own fees. Without SimIntPay data the local resolved fees are used.
 */
export async function listEffectiveFees(
	prisma: PrismaInstance,
	companyId: string,
): Promise<EffectiveFeeReturn[]> {
	const snapshot = await getCompanyFeeSnapshot(companyId);
	if (snapshot?.mode === "SIMINTPAY_ONLY") return [];
	const totals = snapshot?.additiveFees;
	if (!totals) return listCompanySurcharges(prisma, companyId);
	// Pricing consumes actual provider rates; provenance mutations belong to the serialized sync/admin path.
	const integration = await prisma.companySimpayIntegration.findUnique({ where: { companyId } });
	const owned = integration && !integration.additiveFeeOverridden && integration.additiveFeeRevision === totals.revision;
	if (!owned) return syntheticFees(totals.effective);
	const local = await listCompanySurcharges(prisma, companyId);
	return syntheticFees(totals.effective, productDisplayModeOf(local), checkoutOnlyProductTotals(local), local);
}

/** Active surcharges after company overrides, regardless of the company's fee mode. */
export async function listCompanySurcharges(
	prisma: PrismaInstance,
	companyId: string,
): Promise<EffectiveFeeReturn[]> {
	// Keeps lightweight test/local adapters compatible; production Prisma always exposes this model.
	if (!prisma.platformFee) return [];
	const fees = await prisma.platformFee.findMany({
		include: { companyOverrides: { where: { companyId } } },
		orderBy: { createdAt: "asc" },
		where: { active: true, deletedAt: null },
	});
	return fees.flatMap(fee => {
		const override = fee.companyOverrides[0];
		if (override?.active === false) return [];
		return [
			{
				applicationScope: fee.applicationScope as EffectiveFeeReturn["applicationScope"],
				displayMode: fee.displayMode as EffectiveFeeReturn["displayMode"],
				fixedValue: override?.fixedOverride ?? fee.fixedValue,
				id: fee.id,
				name: fee.name,
				percentageValue: override?.percentageOverride ?? fee.percentageValue,
			},
		];
	});
}
