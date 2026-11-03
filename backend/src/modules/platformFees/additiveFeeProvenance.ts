import type { SimpayAdditiveFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";

/** Serialize provider observations with writes and their local acknowledgment across backend processes. */
export async function withAdditiveFeeLock<T>(prisma: PrismaInstance, companyId: string, run: (tx: PrismaInstance) => Promise<T>): Promise<T> {
	return prisma.$transaction(async tx => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`additive-fees:${companyId}`}, 0))`;
		return run(tx as unknown as PrismaInstance);
	}, { timeout: 45_000 });
}

/** Unknown preexisting provider settings are protected until the explicit legacy handoff. */
export async function additiveFeeOwnership(prisma: PrismaInstance, companyId: string, fees: SimpayAdditiveFees | undefined, persist = true) {
	const integration = await prisma.companySimpayIntegration.findUnique({ where: { companyId } });
	if (!integration || !fees) return { overridden: true, protected: true, revision: null };
	const revision = integration.additiveFeeRevision;
	if (revision === null && fees.revision !== "0") return { overridden: true, protected: true, revision };
	const overridden = integration.additiveFeeOverridden || (revision !== null && revision !== fees.revision);
	if (persist && overridden && !integration.additiveFeeOverridden) {
		await prisma.companySimpayIntegration.updateMany({
			where: { companyId, additiveFeeRevision: revision },
			data: { additiveFeeOverridden: true },
		});
	}
	return { overridden, protected: false, revision };
}

/** Never let an older concurrent response acknowledge a newer provider revision. */
export async function acknowledgeAdditiveFees(prisma: PrismaInstance, companyId: string, previous: string | null, revision: string) {
	await prisma.companySimpayIntegration.updateMany({
		where: { companyId, additiveFeeRevision: previous, additiveFeeOverridden: false },
		data: { additiveFeeRevision: revision },
	});
}
