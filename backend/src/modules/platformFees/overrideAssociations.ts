import type { SimpayAdditiveFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { listCompanySurcharges } from "./effectiveFees";

/**
 * While a SimIntPay admin overrides a company's additive total, Delivery's fee associations no longer mean anything:
 * make every fee that currently applies to the company not apply (company override with active=false). Idempotent:
 * writes only for fees still applying. Never throws; the next read retries.
 */
export async function undoAssociationsWhileOverridden(
	prisma: PrismaInstance,
	companyId: string,
	additiveFees: Pick<SimpayAdditiveFees, "override"> | undefined,
): Promise<number> {
	if (!additiveFees?.override || !prisma.companyFeeOverride) return 0;
	try {
		const applying = await listCompanySurcharges(prisma, companyId);
		for (const fee of applying) {
			const where = { feeId_companyId: { companyId, feeId: fee.id } };
			await prisma.companyFeeOverride.upsert({
				create: { active: false, companyId, feeId: fee.id },
				update: { active: false },
				where,
			});
		}
		return applying.length;
	} catch (error) {
		console.error(`[additive-fee-override] could not undo associations for company ${companyId}`, error);
		return 0;
	}
}
