# Repository layer (scaffolding)

Standalone repository abstraction for the kernel domain. Built as the foundation
for migrating use-cases and services off the raw Prisma client so domain logic can
be unit-tested against in-memory repositories (no DB, parallel) while E2E tests
keep exercising the real database.

> **Status: not yet wired in.** These modules compile and are fully implemented, but no
> use-case/service consumes them yet. The migration is staged — see the rollout plan — to
> avoid a single non-compiling big-bang across the whole backend.

## Shape

- `rows.ts` — plain row shapes returned by repositories (Decimal columns already `number`,
  timestamps `Date`). Use-cases and the existing `toXxxDTO` mappers consume these, never Prisma rows.
- `<Aggregate>Repository.ts` — the interface per aggregate. Methods are named after how use-cases query.
- `UnitOfWork.ts` — `UnitOfWork<Ctx>`: groups multi-aggregate writes into one atomic transaction.
  `TxClient` is the Prisma client or its `$transaction` callback client.
- `index.ts` — `Repositories` (the kernel repo set) + `KernelUnitOfWork`.
- `prisma/` — Prisma-backed implementations + `buildPrismaRepositories(db)` /
  `createPrismaUnitOfWork(prisma)`.
- `mock/` — array-backed implementations over a shared `MockStore` + `createMockKernel()`
  (repos + a UoW whose `run` just invokes the callback). For unit tests.

## Migration contract

A use-case/service takes `Repositories` (and `KernelUnitOfWork` when it writes atomically) in
its constructor instead of `PrismaInstance`. Controllers build the Prisma-backed set once from
`prisma` (via `GlobalPlugin`) and inject it; unit tests pass `createMockKernel()`.
