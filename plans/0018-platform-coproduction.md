# 0018 — Platform coproduction

Approved: platform defaults for direct canonical sales and five product types. Own
product agreement overrides default, including explicit empty lists. OWN/INHERIT is
versioned; existing agreements remain OWN. Platform owner/admin manage settings in
SIM INT PAY only. Delivery sends items after discounts/credits separately from
freight, never participants. Percentages apply to eligible items, residual/freight
to financial beneficiary; existing fees unchanged. Freeze before charge, preserve
historical and subscription snapshots. No remote actions.

## Progress
- [x] Provider: additive migration, agreement modes, platform authorization/defaults.
- [x] Provider: canonical snapshot, item base, settlement/reports compatibility.
- [x] Delivery: frozen item/freight breakdown, compatibility, operational errors.
- [x] SIM INT PAY frontend: platform editor, explicit product inheritance, receipts.
- [ ] Local financial/UI tests, hooks/builds, documentation and local commits.

## Publication
Provider migration/backend first, Delivery breakdown next, SIM INT PAY UI next;
enable agreements only after read-only binding audit. Never automatically enable
5%, move balances, or rewrite history. Shared historical Delivery platforms must be
regularized before enabling independent company defaults. Preserve unrelated work.

## Validation in progress
- Provider SQL: 10 passed against isolated local PostgreSQL (new schema + original push triggers).
- Delivery: 88 focused unit tests passed; old attempt hash compatibility covered.
- Provider canonical mock suite and frontend unit suite passed; browser/build gates ongoing.
- Existing staged provider diagnostic SQL and untracked bunfig.toml remain outside scope.
