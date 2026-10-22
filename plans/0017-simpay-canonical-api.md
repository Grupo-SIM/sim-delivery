# 0017 — SIM INT PAY canonical migration

Approved scope: migrate Delivery onboarding, customers/card tokenization, payments,
wallet/withdrawals, reconciliation and callbacks to the canonical API. Preserve
historical ownership, balances, allocations and public Delivery contracts. No remote
migration, push or deployment. Central Delivery acquiring profile explicitly shared;
separate credentials and wallets for each company. Legacy cards may require re-entry
only when required metadata cannot be recovered.

## Execution

- [ ] Provider: canonical bootstrap, delegated credentials and explicit acquiring profile.
- [ ] Provider: canonical card/payment/withdrawal contracts and historical compatibility.
- [ ] Delivery: encrypted integration state, canonical adapter and durable payment attempts.
- [ ] Events: signed company-scoped inbox/outbox with legacy delivery compatibility.
- [ ] Audit, integration docs, tests, builds and scoped validation.

## Publication (operator only)

Apply prepared migrations and configure encryption/provisioning keys plus the same DOM
account currently used by Delivery. Publish provider first, run read-only audit and a
controlled validation, then publish Delivery. Keep legacy provider routes and old
callback secrets while in-flight operations drain. Do not transfer or reset balances,
rotate existing account passwords, infer identity by email, or claim ambiguous history.
