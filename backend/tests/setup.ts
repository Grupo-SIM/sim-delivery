import { spawnSync } from "node:child_process";
import path from "node:path";

/**
 * Global test bootstrap (registered via bunfig.toml `[test] preload`). Runs ONCE
 * before any test file imports the `sql` client.
 *
 * Points at a dedicated test database via `DATABASE_TEST_URL` (a full connection
 * string to an already-existing database, separate from the dev `DATABASE_URL`),
 * so tests never touch dev data:
 *   1. require DATABASE_TEST_URL,
 *   2. repoint process.env.DATABASE_URL to it BEFORE `sql` is imported anywhere,
 *   3. `prisma db push --force-reset` for a clean slate every run (drops all tables
 *      then re-applies the schema, wiping any state left by a prior/crashed run),
 *   4. run the seed (idempotent).
 */

const SQL_DIR = path.resolve(import.meta.dir, "../../packages/sql");

function run(cmd: string, args: string[], env: Record<string, string>): void {
	const result = spawnSync(cmd, args, {
		cwd: SQL_DIR,
		env: { ...process.env, ...env },
		stdio: "pipe",
	});
	if (result.status !== 0) {
		const out = `${result.stdout?.toString() ?? ""}\n${result.stderr?.toString() ?? ""}`;
		throw new Error(`\`${cmd} ${args.join(" ")}\` failed (exit ${result.status}):\n${out}`);
	}
}

// This preload runs ONLY under `bun test`. Whenever a test database is configured we pin
// DATABASE_URL to it *unconditionally* — so a stray DB write during ANY test (an e2e suite
// or a mislabelled file) can never reach the dev/prod database. The adapter in
// `@/shared/infra/sql` reads DATABASE_URL at module load, so this must happen first.
const testUrl = process.env.DATABASE_TEST_URL;
if (testUrl) {
	process.env.DATABASE_URL = testUrl;
}

// Schema reset + seed is expensive and only DB-backed (e2e) suites need it. Unit tests run
// against array-mock repositories and stay DB-free + parallel. We key off the e2e file naming
// convention (`*.e2e.test.ts`) on the command line — no env flag required: running any e2e
// file bootstraps the TEST database, running unit files skips it.
const needsDb = process.argv.some(arg => arg.includes("e2e"));
if (needsDb) {
	if (!testUrl) {
		throw new Error("DATABASE_TEST_URL must point at a dedicated test database to run E2E tests");
	}

	// Clean slate: drop every table then rebuild the schema, then seed rule kinds + plans
	// (both idempotent / upsert-based). --force-reset wipes leftover state from prior runs.
	run("bunx", ["prisma", "db", "push", "--force-reset"], { DATABASE_URL: testUrl });
	run("bun", ["./src/seed/index.ts"], { DATABASE_URL: testUrl });
}
