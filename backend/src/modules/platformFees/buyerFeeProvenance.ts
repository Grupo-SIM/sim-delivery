import type { SimpayBuyerFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";

/** Serialize provider observations with writes and their local acknowledgment across backend processes. */
export async function withBuyerFeeLock<T>(prisma: PrismaInstance, companyId: string, run: (tx: PrismaInstance) => Promise<T>): Promise<T> {
	return prisma.$transaction(async tx => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`buyer-fees:${companyId}`}, 0))`;
		return run(tx as unknown as PrismaInstance);
	}, { timeout: 45_000 });
}

/** Unknown preexisting provider settings are protected until the explicit legacy handoff. */
export async function buyerFeeOwnership(prisma: PrismaInstance, companyId: string, fees: SimpayBuyerFees | undefined, persist = true) {
	const integration = await prisma.companySimpayIntegration.findUnique({ where: { companyId } });
	if (!integration || !fees) return { overridden: true, protected: true, revision: null };
	const revision = integration.buyerFeeRevision;
	if (revision === null && fees.revision !== "0") return { overridden: true, protected: true, revision };
	const overridden = integration.buyerFeeOverridden || (revision !== null && revision !== fees.revision);
	if (persist && overridden && !integration.buyerFeeOverridden) {
		await prisma.companySimpayIntegration.updateMany({
			where: { companyId, buyerFeeRevision: revision },
			data: { buyerFeeOverridden: true },
		});
	}
	return { overridden, protected: false, revision };
}

/** Never let an older concurrent response acknowledge a newer provider revision. */
export async function acknowledgeBuyerFees(prisma: PrismaInstance, companyId: string, previous: string | null, revision: string) {
	await prisma.companySimpayIntegration.updateMany({
		where: { companyId, buyerFeeRevision: previous, buyerFeeOverridden: false },
		data: { buyerFeeRevision: revision },
	});
}

/** Returns the buyer total to Delivery's catalog, acknowledging the provider's current revision as its own. */
export async function releaseBuyerFeeOverride(prisma: PrismaInstance, companyId: string, revision: string) {
	await prisma.companySimpayIntegration.updateMany({ where: { companyId }, data: { buyerFeeOverridden: false, buyerFeeRevision: revision } });
}
