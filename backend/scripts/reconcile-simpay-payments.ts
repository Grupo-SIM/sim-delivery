import { ReconcileSimpayPayments } from "../src/modules/withdrawals/reconcile-payments";
import { simpay } from "../src/shared/infra/simpay";
import { prisma } from "../src/shared/infra/sql";

const execute = process.argv.includes("--execute");
const results = await new ReconcileSimpayPayments(prisma, simpay).execute(!execute);

console.table(results.map(result => ({
	attributed: result.attributed,
	companyId: result.companyId,
	conflicts: result.conflicts.length,
	creditedCents: result.creditedCents,
	dryRun: result.dryRun,
	integrationKey: result.integrationKey,
	paymentCount: result.paymentCount,
	skipped: result.skipped,
})));

for (const result of results) {
	if (result.conflicts.length > 0) console.error(`${result.integrationKey}: conflitos em ${result.conflicts.join(", ")}`);
}

if (!execute) console.info("Dry-run concluído. Use --execute somente após conferir os resultados.");
if (results.some(result => result.conflicts.length > 0)) process.exitCode = 2;

await prisma.$disconnect();
