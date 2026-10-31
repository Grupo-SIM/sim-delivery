/**
 * One-shot: copies Delivery's local `platform_fee` + `company_fee_override` rows to SimIntPay (additive fee catalog
 * and per-company association/overrides). Read raw SQL so it works before AND after the Prisma models are removed,
 * but it must run BEFORE migration 20261031200000_drop_local_additive_fees is applied.
 *
 * Dry run by default (prints the plan, writes nothing). Pass --apply to write to SimIntPay. Idempotent: catalog fees
 * are matched by case-insensitive name; association/overrides are re-sent as-is.
 *
 *   bun ./scripts/migrate-additive-fees-to-simintpay.ts [--apply]
 */
import { simpay, type SimpayAdditiveFee, type SimpayAdditiveFeeEdit } from "../src/shared/infra/simpay";
import { prisma } from "../src/shared/infra/sql";

const apply = process.argv.includes("--apply");

interface LocalFee {
	active: boolean;
	applicationScope: "order" | "product";
	deletedAt: Date | null;
	displayMode: SimpayAdditiveFee["displayMode"];
	fixedValue: number;
	id: string;
	name: string;
	percentageValue: number;
}
interface LocalOverride {
	active: boolean;
	companyId: string;
	feeId: string;
	fixedOverride: number | null;
	percentageOverride: number | null;
}

try {
	const fees = await prisma.$queryRaw<LocalFee[]>`SELECT id, name, "applicationScope", "percentageValue", "fixedValue", "displayMode", active, "deletedAt" FROM platform_fee WHERE "deletedAt" IS NULL`;
	const overrides = await prisma.$queryRaw<LocalOverride[]>`SELECT "feeId", "companyId", "percentageOverride", "fixedOverride", active FROM company_fee_override`;
	const companies = await prisma.$queryRaw<{ id: string; name: string }[]>`SELECT id, name FROM company`;
	console.log(`mode=${apply ? "APPLY" : "DRY-RUN"} fees=${fees.length} overrides=${overrides.length} companies=${companies.length}`);

	// 1. Catalog: reuse a SimIntPay fee with the same name, otherwise create it.
	const remote = await simpay.listAdditiveFees();
	const idMap = new Map<string, string>();
	for (const fee of fees) {
		const existing = remote.find(row => row.name.trim().toLowerCase() === fee.name.trim().toLowerCase());
		if (existing) {
			idMap.set(fee.id, existing.id);
			console.log(`catalog: reuse "${fee.name}" -> ${existing.id}`);
			continue;
		}
		if (!apply) {
			idMap.set(fee.id, `(new:${fee.id})`);
			console.log(`catalog: would create "${fee.name}"`);
			continue;
		}
		const created = await simpay.createAdditiveFee({
			active: fee.active,
			applicationScope: fee.applicationScope,
			displayMode: fee.displayMode,
			fixedValue: fee.fixedValue,
			name: fee.name,
			percentageValue: fee.percentageValue,
		});
		idMap.set(fee.id, created.id);
		console.log(`catalog: created "${fee.name}" -> ${created.id}`);
	}

	// 2. Per company: every active fee applied to everyone unless the override deactivated it.
	let failures = 0;
	for (const company of companies) {
		const edits: SimpayAdditiveFeeEdit[] = fees
			.filter(fee => fee.active)
			.flatMap(fee => {
				const override = overrides.find(row => row.companyId === company.id && row.feeId === fee.id);
				const feeId = idMap.get(fee.id);
				if (!feeId) return [];
				return [{
					associated: override ? override.active : true,
					feeId,
					fixedOverride: override?.fixedOverride ?? null,
					percentageOverride: override?.percentageOverride ?? null,
				}];
			});
		if (!edits.length) continue;
		if (!apply) {
			console.log(`company ${company.id} (${company.name}): would associate ${edits.filter(edit => edit.associated).length}/${edits.length} fees`);
			continue;
		}
		try {
			const current = await simpay.companyFees(company.id);
			await simpay.saveCompanyFees(company.id, { additiveFees: edits, disabledLanes: current.disabledLanes, lanes: [], mode: current.mode, version: current.version });
			console.log(`company ${company.id} (${company.name}): ok (${edits.length} edits)`);
		} catch (error) {
			failures += 1;
			console.error(`company ${company.id} (${company.name}): FAILED ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	console.log(failures ? `done with ${failures} failure(s); fix and re-run before applying the drop migration` : "done");
	process.exitCode = failures ? 1 : 0;
} finally {
	await prisma.$disconnect();
}
