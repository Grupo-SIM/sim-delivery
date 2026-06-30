import type { KernelUnitOfWork, Repositories } from "@/shared/repositories";
import type { TxClient } from "@/shared/repositories/UnitOfWork";

/** Builds the kernel repository set bound to a Prisma client or transaction client. */
export function buildPrismaRepositories(db: TxClient): Repositories {
	void db;
	return {};
}

/**
 * Prisma-backed Unit of Work. `run` opens an interactive transaction and rebuilds the
 * repo set over the transaction client so every write inside the callback is atomic.
 * `prisma` here is the extended client; its `$transaction` hands a tx client to the
 * callback (typed via TxClient).
 */
export function createPrismaUnitOfWork(prisma: TxClient): KernelUnitOfWork {
	return {
		repos: buildPrismaRepositories(prisma),
		run<T>(fn: (ctx: Repositories) => Promise<T>): Promise<T> {
			// Only the full client exposes $transaction; a nested tx client would already be
			// inside one, so callers must pass the root client here.
			return (prisma as Extract<TxClient, { $transaction: unknown }>).$transaction(tx =>
				fn(buildPrismaRepositories(tx)),
			);
		},
	};
}
