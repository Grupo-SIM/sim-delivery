# 0004 — Site-scoped login (superAdmin cross-company access)

## Context

Follow-up to the superAdmin cross-company read/write fixes (reports 403, list use-cases,
create/update/delete parity — see recent commits). Those fixes made `companyId === null`
mean "no filter" wherever a use-case takes a `companyId`. This plan covers the remaining
piece: how a session actually gets `companyId: null` (or a specific company) in the first
place.

Confirmed design (via user Q&A, not yet implemented):

- Each frontend deployment belongs to exactly one company. The frontend knows its own
  companyId via a build-time env var (e.g. `VITE_COMPANY_ID`).
- On login, the frontend sends that companyId as a query param on the `signIn.email` call.
- Backend behavior per role, given the requested site companyId:
  - `superAdmin`: session gets scoped to the requested companyId for that session only.
    The user's own DB row stays `companyId: null` (cross-tenant identity preserved).
  - staff (`owner`/`manager`/`attendant`/`kitchen`/`courier`) whose own `companyId` matches
    the requested site: unchanged, normal staff session.
  - staff whose own `companyId` does **not** match the requested site: session is treated
    as a plain `customer` for that site (their staff powers don't apply on someone else's
    site, but they can still log in and shop as a customer there).
  - `customer`: unaffected.
- The effective (per-session) companyId/role must live on the **Session** row, not the
  User row — a Prisma migration adds `companyId`/`role` override columns to `session`,
  configured via Better Auth's `session.additionalFields`.
- `CompanyScopeGuard.execute` needs to prefer the session-level override over
  `session.user.companyId`/`role` when present, with a DB fallback consistent with the
  existing comment about Better Auth omitting additionalFields from the session payload.

## Steps

1. **Schema**: add `companyId String?` and `role String?` to the `Session` model in
   `packages/sql/src/models/auth.prisma`; generate a local migration (do not push to any
   shared DB — local dev only, per repo policy).
2. **Better Auth config** (`backend/src/shared/infra/betterAuth.ts`): register
   `session: { additionalFields: { companyId: {...}, role: {...} } }`.
3. **Sign-in hook**: add an `after` hook (via `createAuthMiddleware`) matching
   `/sign-in/email` that reads `ctx.query.companyId`, looks up the just-created session +
   user, and writes the effective `companyId`/`role` onto the session row per the rules
   above.
4. **`CompanyScopeGuard.execute`**: read `session.session.companyId`/`role` first, falling
   back to `session.user.companyId`/`role`, then to the existing DB-lookup fallback.
5. **Frontend**: add `VITE_COMPANY_ID` (or equivalent) env var; pass it as a query param in
   `authClient.signIn.email(...)` in `frontend/src/stores/auth.ts`.
6. Tests: unit-test the sign-in hook's role/companyId decision table directly (the 4 cases
   above); update `CompanyScopeGuard` tests for the new precedence order.

## Open questions to confirm before starting

- Exact env var name and where it's injected (Vite `.env` per deployment vs. `apps/*`
  build config — check how per-tenant frontend deployments are currently built, if at all;
  today's codebase has a single frontend app with no existing multi-site build setup).
- Whether "logged in as customer" on a mismatched site should be silent or surfaced to the
  user (e.g. a toast saying "you're not staff here").
