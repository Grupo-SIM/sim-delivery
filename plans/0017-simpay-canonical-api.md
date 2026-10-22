# 0017 — SIM INT PAY canonical migration

Approved scope: migrate Delivery onboarding, customers/card tokenization, payments,
wallet/withdrawals, reconciliation and callbacks to the canonical API. Preserve
historical ownership, balances, allocations and public Delivery contracts. No remote
migration, push or deployment. Central Delivery acquiring profile explicitly shared;
separate credentials and wallets for each company. Legacy cards may require re-entry
only when required metadata cannot be recovered.

## Execution

- [x] Provider: canonical bootstrap, delegated credentials and explicit acquiring profile.
- [x] Provider: canonical card/payment/withdrawal contracts and historical compatibility.
- [x] Delivery: encrypted integration state, canonical adapter and durable payment attempts.
- [x] Events: signed company-scoped inbox/outbox with legacy delivery compatibility.
- [x] Audit, integration docs, tests, builds and scoped validation.

## Publication (operator only)

Apply prepared migrations and configure encryption/provisioning keys plus the same DOM
account currently used by Delivery. Publish provider first, run read-only audit and a
controlled validation, then publish Delivery. Keep legacy provider routes and old
callback secrets while in-flight operations drain. Do not transfer or reset balances,
rotate existing account passwords, infer identity by email, or claim ambiguous history.

## Validation

- Provider: 93 focused mock tests passed; local PostgreSQL suite 3 passed:
  reservation without account, atomic rollback, stable credentials/password/balance,
  slug rename and company isolation, historical ownership proof without rewriting.
- Delivery: full hook unit suite passed; focused suites cover legacy card re-entry,
  unknown outcomes, frozen allocation, signed early/repeated callbacks and compatibility.
  Local PostgreSQL suite 2 passed: concurrent attempt exclusion and terminal retry.
- New migrations applied successfully on isolated loopback PostgreSQL, port 55439.
- Backend type-check and build, frontend TypeScript/Vite build, provider Nest build passed.
- OpenAPI exported locally and SDK regenerated (570 files); generated SDK is ignored.
- Both audit scripts and profile configuration dry-run verified against local database.
- No outbound operational legacy/DOM calls remain in Delivery production code.
- No remote migrations, pushes or deployments performed. Historical ambiguity blocks
  company activation; refund remains the existing manual fallback.
