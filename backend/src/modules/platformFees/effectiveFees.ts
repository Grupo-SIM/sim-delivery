import type { PrismaInstance } from "@/shared/infra/sql";
import type { EffectiveFeeReturn } from "./dtos";

export async function listEffectiveFees(
	prisma: PrismaInstance,
	companyId: string,
): Promise<EffectiveFeeReturn[]> {
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
				calculationType: fee.calculationType as EffectiveFeeReturn["calculationType"],
				displayMode: fee.displayMode as EffectiveFeeReturn["displayMode"],
				id: fee.id,
				name: fee.name,
				value: override?.valueOverride ?? fee.value,
			},
		];
	});
}
