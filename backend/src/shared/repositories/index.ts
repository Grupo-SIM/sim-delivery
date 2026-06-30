import type { UnitOfWork } from "./UnitOfWork";

/**
 * The kernel repository set shared by the bets / breaches / challenges domain.
 * Built once from the Prisma client (prod) or from in-memory stores (unit tests),
 * and injected into use-cases/services instead of the raw Prisma client.
 */
export type Repositories = {};

/** A Unit of Work whose transactional context exposes the full kernel repo set. */
export type KernelUnitOfWork = UnitOfWork<Repositories>;

export type { UnitOfWork } from "./UnitOfWork";
