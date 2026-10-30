import type { PrismaInstance } from "@/shared/infra/sql";
import type { EffectiveFeeReturn } from "./dtos";
import type { PlatformFeeMode } from "./feeCoverage";

/** Lightweight test/local adapters without a company model keep the historical additive-only behavior. */
export async function getCompanyFeeMode(prisma: PrismaInstance, companyId: string): Promise<PlatformFeeMode> {
	const company = await prisma.company?.findUnique({ select: { platformFeeMode: true }, where: { id: companyId } });
	return (company?.platformFeeMode as PlatformFeeMode | undefined) ?? "ADDITIVE_ONLY";
}

/** Surcharges charged to buyers; `SIMINTPAY_ONLY` mode leaves cost recovery entirely to SimIntPay's own fees. */
export async function listEffectiveFees(
	prisma: PrismaInstance,
	companyId: string,
): Promise<EffectiveFeeReturn[]> {
	if ((await getCompanyFeeMode(prisma, companyId)) === "SIMINTPAY_ONLY") return [];
	return listCompanySurcharges(prisma, companyId);
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
