# Plan 0002 — JB Delivery: Improvements & Gaps

> Carries over all [MVP+] leftovers from 0001 and adds product/quality improvements.
> Same conventions: one commit per step, Conventional Commits, each step must compile and pass tests.

---

## Leftover from 0001

- **É6.2** — Order scheduling: `scheduledFor` field on Order + admin filter + customer date-time picker on checkout.

---

## É14 — Admin completeness

> Features that should exist in the admin panel but were skipped.

- **14.1** Coupon admin CRUD — owner creates/lists/disables coupons (`/admin/coupons`). Backend already exists; only the admin UI is missing.
- **14.2** Customer list — admin page `/admin/customers` (name, phone, order count, cashback balance). Backend `GET /customers` exists; add frontend page.
- **14.3** Admin order detail drawer — clicking an order row opens a side-drawer with full order info (items, address, timeline, delivery status). Currently only a status-update action exists.
- **14.4** Unit address edit — unit configuration modal currently has no address fields. Add address section (CEP autofill, like the checkout form).
- **14.5** Staff edit — owner can update an employee's name/email after invite. Currently only level and removal are possible.
- **14.6** Reports: unit filter in frontend + custom date range picker (today/week/month presets stay; add "Custom" with from/to inputs).
- **14.7** Order CSV export — `GET /reports/orders/export` returns CSV; admin reports page has a download button.

---

## É15 — Customer experience

- **15.1** Customer order history — store page `/$unitId/orders` lists the customer's past orders (paginated, newest first), with status badge and items summary. Requires `GET /orders?customerId=me` scoped to customer.
- **15.2** Customer profile edit — allow updating name and CPF after initial setup. Currently the profile form only shows once before checkout.
- **15.3** PWA — `manifest.json`, service worker (cache-first for static assets), `apple-touch-icon`. Enables "Add to Home Screen" on iOS/Android without Tauri.
- **15.4** SEO meta tags — dynamic `<title>` and OG tags per store page (unit name, description from footer text, logo as OG image).

---

## É16 — Quality: tests

> É10–É13 use cases have no unit tests. Follow the pattern established in É0–É9.

- **16.1** Backend tests for É10–É11: `deliveries.test.ts` (already exists — extend), `CreateReview.test.ts`, `ListReviews.test.ts`.
- **16.2** Backend tests for É12: `GetRevenueSummary.test.ts`, `GetBestSellers.test.ts`, `GetBranding.test.ts`, `UpdateBranding.test.ts`.
- **16.3** Backend tests for É13 — no use cases to test, but add a Node/Bun script smoke test for `inject-variant.ts` (reads variants.json, writes expected output).
- **16.4** Frontend E2E — Playwright test for the courier flow: sign in as courier → see assigned delivery → accept → start route → mark delivered.

---

## É17 — Quality: pagination & performance

- **17.1** Cursor-based pagination on `GET /orders` — add `cursor` + `limit` query params (default 50). Frontend admin orders page loads next page on scroll-to-bottom.
- **17.2** Cursor-based pagination on `GET /reviews` — same pattern; admin reviews page.
- **17.3** Add `GET /health` endpoint on backend — returns `{ status: "ok", version }`. Used by CI smoke test and container health checks.
- **17.4** Startup env validation — backend throws a descriptive error at boot if required env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.) are missing or malformed. Prevents silent misconfiguration in production.

---

## É18 — Stock management

> `UnitProduct.stock` field exists but is never decremented.

- **18.1** Backend: decrement `UnitProduct.stock` inside the `CreateOrder` UoW; reject items whose stock would go below 0 with `OUT_OF_STOCK` (422). Re-check stock at payment confirmation (webhook).
- **18.2** Admin stock UI — unit menu page shows stock count inline; owner can set/clear stock. Low-stock (≤ 5) shows a warning badge.
- **18.3** Store: hide or mark "Sold out" any unit product with `stock === 0`.

---

## É19 — Multi-language

> Only `en-US` locale exists. Most real users are Brazilian.

- **19.1** Add `pt-BR.json` locale (full translation of all `en-US` keys). Use `en-US` strings as source — do not machine-translate placeholders; mark TODOs where translation needs review.
- **19.2** Language auto-detection — `i18next-browser-languagedetector` is already installed; wire it up so the app starts in the user's browser language and falls back to `en-US`.
- **19.3** Language switcher in the store header (flag icon, `pt-BR` / `en-US` toggle). Admin panel follows browser preference only.

---

## É20 — Delivery zones (MVP+)

> Currently flat delivery fee per unit. Real operators need zone-based or distance-based pricing.

- **20.1** `DeliveryZone` model — polygon or radius per unit with its own fee. Migrate `Unit.deliveryFee` to be the default/fallback only.
- **20.2** Zone assignment — `SimulateFreight` resolves which zone the customer's address falls into and returns the zone fee (or default if no zone matches).
- **20.3** Admin zone editor — map-based UI (Leaflet) for drawing zones. MVP: radius zones (center lat/lng + radius km + fee).

---

## É21 — Notifications: email

> Only WhatsApp notifications currently exist.

- **21.1** Email provider abstraction — `IEmailProvider` interface (same pattern as `IWhatsAppProvider`). Implement `ResendEmailProvider` (Resend.com API) and `ConsoleEmailProvider` (dev).
- **21.2** Order lifecycle emails — send order confirmation, status change (em_preparo, saiu_para_entrega, entregue) emails to the customer's email address.
- **21.3** Staff invite email — when owner invites a new employee, send credentials (temp password) by email instead of having the owner copy-paste them.

---

## Verificação (same gate as 0001)

- Per step: `bun run check-types` + `bun run build` (affected) green; affected tests pass; 1 commit.
- New unit tests must hit ≥ 95% of new use-case logic (no trivial coverage padding).
- No remote actions (no push, no migration against shared DB) without explicit instruction.
