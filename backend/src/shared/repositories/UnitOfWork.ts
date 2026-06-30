import type { PrismaInstance } from "@/shared/infra/sql";

/**
 * Either the extended Prisma client or the transaction client handed to a
 * `$transaction` callback. Derived from PrismaInstance so the extended client's
 * model delegates line up exactly (a bare `Prisma.TransactionClient` does not).
 */
export type TxClient = PrismaInstance | Parameters<Parameters<PrismaInstance["$transaction"]>[0]>[0];

/**
 * A Unit of Work groups several repository writes into one atomic transaction.
 *
 * Use-cases that mutate more than one aggregate atomically (e.g. create a bet +
 * bankroll event + audit log) call `run`, receiving a `RepoContext` whose
 * repositories are all bound to the same transaction. Single-repo use-cases skip
 * the UoW and use the repositories directly.
 *
 * - Prisma implementation: `run` opens `prisma.$transaction` and rebuilds the repo
 *   set over the transaction client.
 * - Mock implementation: `run` simply invokes the callback with the in-memory repo
 *   set — arrays are in-process, so atomicity is trivially satisfied for unit tests.
 *
 * `Ctx` is the module/vertical-specific bundle of repositories (the RepoContext).
 */
export interface UnitOfWork<Ctx> {
	/** The repositories outside any transaction (auto-commit, one statement each). */
	readonly repos: Ctx;
	/** Runs `fn` inside a transaction; every repo in `ctx` shares that transaction. */
	run<T>(fn: (ctx: Ctx) => Promise<T>): Promise<T>;
}
