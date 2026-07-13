# Plan 0013 — Dynamic branding theme

## Objective

Allow company owners to edit every semantic light/dark theme color. Persist colors per company, apply them to Tailwind and BaseUI, and cache branding until a successful update.

## Steps

- [x] Add persisted theme-color contract, migration, DTOs, and branding use-case mappings.
- [x] Regenerate OpenAPI frontend SDK.
- [x] Apply cached branding colors to CSS and BaseUI. Invalidate cache after save.
- [x] Expand branding form and translations for all theme colors.
- [x] Verify affected package types, tests, and builds.
