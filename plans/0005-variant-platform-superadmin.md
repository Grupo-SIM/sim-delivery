# 0005 — Restrict platform access on variant builds

## Goal

When `VITE_VARIANT_KEY` is set, hide and deny `/admin` platform areas and
`/admin/companies` unless the current user is a `superAdmin`. Company listing
and creation must remain superAdmin-only at the backend boundary.

## Steps

- [x] Inspect variant, admin navigation, route guards, and company controller.
- [x] Enforce superAdmin platform access in variant frontend builds.
- [x] Verify company list/create authorization and add coverage.
- [x] Run affected checks and commit atomically.
