/**
 * One-off: resolves each company's additive fees (active, associated, overrides applied) and replaces the list stored
 * in SimIntPay. Only pushes when SimIntPay's list differs, so it is safe to re-run.
 *
 * Dry run by default; pass --execute to write to SimIntPay. Optionally limit to companies with --company=<id>.
 *
 *   bun ./scripts/sync-additive-fees-to-simintpay.ts [--execute] [--company=<id>]
 */
import { AdditiveFeeSync } from "../src/modules/platformFees/additiveFeeSync";
import { prisma } from "../src/shared/infra/sql";

const execute = process.argv.includes("--execute");
const only = process.argv.find(arg => arg.startsWith("--company="))?.slice("--company=".length);

const outcomes = await new AdditiveFeeSync(prisma).pushMany(only ? [only] : undefined, { dryRun: !execute });

console.table(outcomes.map(outcome => ({
	companyId: outcome.companyId,
	error: outcome.error instanceof Error ? outcome.error.message : "",
	fees: outcome.values?.length ?? 0,
	result: outcome.result ?? "failed",
})));

if (!execute) console.info("Dry-run concluído. Use --execute somente após conferir os resultados.");
if (outcomes.some(outcome => outcome.error)) process.exitCode = 2;

await prisma.$disconnect();
