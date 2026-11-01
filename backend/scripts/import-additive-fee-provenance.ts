/** Import a reviewed legacy export, or deliberately return a company to catalog control. Dry-run by default. */
import { readFile } from "node:fs/promises";
import { withAdditiveFeeLock } from "../src/modules/platformFees/additiveFeeProvenance";
import { simpay } from "../src/shared/infra/simpay";
import { prisma } from "../src/shared/infra/sql";

const value = (key: string) => process.argv.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
const apply = process.argv.includes("--apply");
const file = value("file");
const release = value("release-company");
const expected = value("expected-revision");
const url = new URL(process.env.DATABASE_URL ?? "postgresql://missing");
console.info(`Target database host: ${url.hostname}; mode: ${apply ? "apply" : "dry-run"}`);
if (apply && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) throw new Error("Apply is restricted to a local database. Review and execute remote handoff manually with explicit authorization.");
if ((!file && !release) || (file && release)) throw new Error("Use --file=<export.json> OR --release-company=<id> --expected-revision=<revision>");

type Row = { companyId: string; platformId: string; revision: string; overridden: boolean };
const rows: Row[] = file ? JSON.parse(await readFile(file, "utf8")) : [{ companyId: release!, platformId: "", revision: expected!, overridden: false }];
if (!Array.isArray(rows)) throw new Error("Expected JSON array");
const seen = new Set<string>();
for (const row of rows) {
	if (!row || typeof row.companyId !== "string" || typeof row.platformId !== "string" || (!release && !row.platformId) || typeof row.revision !== "string" || !/^\d+$/.test(row.revision) || typeof row.overridden !== "boolean" || seen.has(row.companyId)) throw new Error("Invalid or duplicate provenance row");
	seen.add(row.companyId);
}
try {
	for (const row of rows) {
		await withAdditiveFeeLock(prisma, row.companyId, async tx => {
			const integration = await tx.companySimpayIntegration.findUnique({ where: { companyId: row.companyId } });
			if (!integration || (!release && (!row.platformId || integration.platformId !== row.platformId))) throw new Error(`Company/platform mismatch: ${row.companyId}`);
			const current = await simpay.companyFees(row.companyId);
			if (current.additiveFees?.revision !== row.revision) throw new Error(`Provider revision changed: ${row.companyId}; export/review again`);
			if (!release && integration.additiveFeeRevision !== null) throw new Error(`Already initialized: ${row.companyId}`);
			console.info(JSON.stringify({ ...row, action: release ? "release-to-catalog" : "import", apply }));
			if (apply) await tx.companySimpayIntegration.update({ where: { companyId: row.companyId }, data: { additiveFeeRevision: row.revision, additiveFeeOverridden: row.overridden } });
		});
	}
} finally {
	await prisma.$disconnect();
}
