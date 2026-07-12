# 0004 — Site-scoped login (superAdmin cross-company access)

**Status: implemented.** See commits following this plan's initial write-up.

## Context

Follow-up to the superAdmin cross-company read/write fixes (reports 403, list use-cases,
create/update/delete parity). Those fixes made `companyId === null` mean "no filter"
wherever a use-case takes a `companyId`. This plan covers how a session actually gets
`companyId: null` (or a specific company) in the first place.

**Key discovery during implementation**: the codebase already has the exact "site" concept
needed — `variantKey` (docs/02, whitelabel builds). Each frontend build bakes in
`VITE_VARIANT_KEY` (`frontend/src/lib/variant.ts`), which resolves to `Company.variantKey`
server-side. Public storefront routes (coupons, loyalty, cashback, orders) already thread
`variantKey` through to resolve a companyId. So no new env var was needed — login reuses
`variantKey` the same way.

Implemented design:

- The frontend sends its own `variantKey` (if any) as a `?variantKey=` query param on
  `authClient.signIn.email(...)` (`frontend/src/stores/auth.ts`).
- `betterAuth.ts`'s `databaseHooks.session.create.before` hook resolves `variantKey` →
  `Company.id`, then calls the pure `resolveSiteSessionOverride` (in
  `backend/src/shared/infra/resolveSiteSessionOverride.ts`) to decide the session-level
  override:
  - `superAdmin`: session scoped to that company (user row stays `companyId: null`).
  - staff whose own `companyId` matches: no override (normal session).
  - staff whose own `companyId` doesn't match: downgraded to `customer` for that session.
  - `customer`, or no `variantKey` sent: no override (unaffected / cross-tenant as before).
- The override lives on the `Session` row (`companyId`/`role` columns added via migration
  `20260712000000_add_session_tenant_override`), configured via Better Auth's
  `session.additionalFields`, input-locked so clients can't set it directly.
- `CompanyScopeGuard.execute` reads the session-level override first (with a DB fallback
  mirroring the existing "Better Auth omits additionalFields" workaround for the user
  fields), falling back to the user's own `companyId`/`role` when no override applies.

## Outstanding for whoever deploys this

- **Migration not applied**: `packages/sql/src/migrations/20260712000000_add_session_tenant_override/migration.sql`
  was written by hand (not run via `prisma migrate dev`) because the configured
  `DATABASE_URL` points at a non-local host — running migrations against it wasn't done
  per the "never affect anything outside this machine" rule. Run
  `bun run migrate:deploy` (in `packages/sql`) against your dev DB before relying on this.
- Whether "logged in as customer" on a mismatched site should be surfaced to the user (e.g.
  a toast) is still open — currently silent.
