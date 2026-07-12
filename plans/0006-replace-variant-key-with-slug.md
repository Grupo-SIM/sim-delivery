# 0006 — Replace variant key with editable company slug

## Goal

Use the unique company `slug` as the white-label deploy identifier. Remove
`variantKey` from the database and application code. Allow superAdmins to edit
company slugs.

## Steps

- [x] Map every variant-key reference and database migration path.
- [x] Replace backend tenant resolution and DTOs with slug.
- [x] Update frontend build configuration and company edit UI.
- [x] Regenerate API artifacts, verify affected packages, and commit.
