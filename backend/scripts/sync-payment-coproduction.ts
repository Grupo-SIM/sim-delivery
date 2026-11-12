/**
 * One-off: copies the frozen coproduction share and SimIntPay fee from SimIntPay onto confirmed payments
 * that were stored with zero coproduction (confirmed before SimIntPay exposed it). Only fills payments
 * whose remote share is positive, so it is safe to re-run.
 *
 * Dry run by default; pass --execute to write locally. Optionally limit with --company=<id>.
 *
 *   bun ./scripts/sync-payment-coproduction.ts [--execute] [--company=<id>]
 */
import { simpay, simpayIntegrationKey } from "../src/shared/infra/simpay";
import { prisma } from "../src/shared/infra/sql";

const execute = process.argv.includes("--execute");
const only = process.argv.find(arg => arg.startsWith("--company="))?.slice("--company=".length);

const payments = await prisma.payment.findMany({
	select: { id: true, order: { select: { company: { select: { id: true, slug: true } } } }, simintpayFeeCents: true, simpayPaymentId: true },
	where: { coproductionCents: 0, simpayPaymentId: { not: null }, status: "confirmed", ...(only ? { order: { companyId: only } } : {}) },
});

const rows: { coproductionCents: number; error: string; paymentId: string; updated: boolean }[] = [];
for (const payment of payments) {
	const company = payment.order?.company;
	if (!company || !payment.simpayPaymentId) continue;
	try {
		const remote = await simpay.getPaymentStatus(payment.simpayPaymentId, { externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug) });
		const changed = remote.coproductionCents > 0;
		if (changed && execute) await prisma.payment.update({ data: { coproductionCents: remote.coproductionCents, ...(payment.simintpayFeeCents === 0 ? { simintpayFeeCents: remote.simintpayFeeCents } : {}) }, where: { id: payment.id } });
		if (changed) rows.push({ coproductionCents: remote.coproductionCents, error: "", paymentId: payment.simpayPaymentId, updated: execute });
	} catch (error) {
		rows.push({ coproductionCents: 0, error: error instanceof Error ? error.message : String(error), paymentId: payment.simpayPaymentId, updated: false });
	}
}

console.table(rows);
if (!execute) console.info("Dry-run concluído. Use --execute somente após conferir os resultados.");
if (rows.some(row => row.error)) process.exitCode = 2;

await prisma.$disconnect();
