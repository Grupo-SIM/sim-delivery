# Company injection reliability

Approved scope: retain required company selection and workflow/image compatibility; stage deterministic branding, clear stale assets, propagate selectors through direct/Turbo/native entrypoints, document and verify locally.

- [x] Inspect injection, Turbo, Docker and native entrypoints.
- [x] Stage frontend outputs before publication; render HTML/native config from canonical templates; clear prior company artwork/native icons.
- [x] Prepare direct dev/build/export/type-check/native commands; preserve company selectors through Turbo and disable database-backed preparation caching.
- [x] Verify missing selection, company switching, hooks and affected builds; record limitations.

Validation: company A → B/unknown fixtures passed, including real Tauri icon generation and fallback cleanup. Missing selection still fails. Backend build and frontend build (including tsc) passed against disposable local PostgreSQL. Normal commit hook passed 552 backend unit tests plus coverage; existing frontend branding asset tests passed 7 cases. No remote database accessed.

Gate limitation: explicit Lefthook type-check run reports existing errors in untouched OrderStatusEmail, getBusinessShiftDateRanges.test, orders.test and WahaClient.test. These prevent integration into main under repository policy; completed changes remain committed on codex/company-injection. Normal commit hooks have legacy glob patterns that skip nested files for types/formatting; these hooks were not bypassed. Native app/Docker compilation was not run; selector plumbing and native icon CLI were verified. Existing company workflow matrices/image naming remain unchanged.
