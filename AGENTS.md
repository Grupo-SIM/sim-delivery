# Global Guidelines

> The sections below apply across every project that uses this `AGENTS.md` / `CLAUDE.md`.

## NEVER affect anything outside the local machine (absolute rule)

Never perform any action whose effect leaves this computer. No exceptions, ever, without an explicit per-instance request from the user.

Forbidden unless the user explicitly asks for that specific action:
- `git push` (or any push to a remote), creating/updating PRs, pushing tags.
- Running database migrations, schema pushes, seeds, or any command against a remote/shared/external database.
- Triggering CI/CD, deploys, or remote jobs; publishing packages; sending requests that mutate external services.

Local work is fine: edit files, run local builds/tests, commit locally. Stop at the local boundary and let the user push / migrate / deploy themselves. If a task seems to need crossing that boundary, describe the exact command and ask first.

## Business Rules — Source of Truth

Project-specific product rules live in [`docs/business-rules.md`](docs/business-rules.md). Keep AGENTS.md focused on agent workflow and engineering conventions; move domain/product rules there instead.

## Git Commits — Required After Every Completed Task

After finishing any task (feature, fix, refactor, or guideline addition), always create a git commit with **the local user as both author and committer** and attribute the agent with a `Co-authored-by:` trailer:

```
git -c commit.gpgsign=false commit -m "..." -m "Co-authored-by: <Agent> <agent-email>"
```

**Never set the agent as author or committer.** Do not pass `--author` with an agent identity and do not override `user.name` or `user.email` with agent details. Use the identity of whichever agent actually contributed the change in the trailer:

- Claude → `Co-authored-by: Claude <noreply@anthropic.com>`
- Codex → `Co-authored-by: Codex <noreply@openai.com>`

Author and committer must always reflect the local machine's configured Git user. If unsure, follow whatever `git config --global` reports.

If the user requests an adjustment to something just delivered, amend or rebase rather than creating a separate noisy commit — keep history clean. Use Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `style`, `chore`) with the monorepo package as scope (e.g. `feat(frontend)`, `fix(backend)`).

**Atomic commits.** One commit = one coherent, complete change (revertible on its own). Never bundle unrelated features/refactors/formatting into the same commit — if an automated formatter touches files outside your change, revert those before committing. Prefer several small, presentable commits over one large one.

**Commit validation is hook-driven.** Do not run formatting, linting, or type-checking as manual pre-commit steps. Stage intended files, then use normal `git commit`; Lefthook runs those checks and stages hook fixes. If a hook fails, fix root cause, stage affected files, and commit again. Never bypass hooks with `--no-verify` or `LEFTHOOK=0`.

## Plans — Versioned in the Repo

Use a plan in the top-level [`plans/`](plans/) folder only for large features executed in Plan mode, so progress survives long or interrupted work. Small tasks, fixes, and work outside Plan mode do not need a plan. Keep `docs/` for product/domain knowledge and `plans/` for planning/execution history; do not keep working plans under `~/.claude/plans`.

- For a required plan, create one file per feature, named with a zero-padded sequential prefix: `NNNN-kebab-slug.md` (e.g. `0001-jb-delivery-mvp.md`). The number gives chronological order; the next plan takes the next number.
- When starting or resuming work covered by a plan, **read** it from `plans/`. After **each completed step**, update progress and upcoming steps, then commit that update alongside the step's changes.

## Pre-PR / Pre-Merge Checks — Required Before Staging or Main

Before opening a PR or merging to `staging` or `main`, run a **type-check** and a **build check** — scoped to the **affected packages only** (don't rebuild the whole monorepo when one package changed). Both must pass before the merge/PR proceeds.

- Type-check: `bun run check-types` (Turbo runs each package's `check-types` = `tsc --noEmit`).
- Build: `bun run build` (Turbo's graph only rebuilds affected packages); scope with `turbo run build -F  when useful.

Enforced automatically in two places, so commit validation is normally hands-off:
- **lefthook `pre-commit`** runs type-checking plus staged formatting/linting, and runs backend unit coverage when backend source is staged.
- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs [`scripts/affected-packages.ts`](scripts/affected-packages.ts) once through the `hyoretsu/gh-actions/detect-affected` composite action and emits a JSON object keyed by task. It asks Turbo's dependency graph (`turbo run <task> --affected`, base = PR base commit) for packages that (a) are affected by the diff (changed **or** transitively depend on a changed package) and (b) define that task as a script. So a change to a shared lib also schedules downstream package jobs. Each downstream job (`check-types`, `build`, `unit`, `e2e`) is a **matrix over its own key**, so an unaffected package spawns no job; an empty list skips the check. `e2e` additionally gates on PRs targeting `staging`/`main` and the presence of `DATABASE_TEST_URL`.

This is a local gate; running it never implies pushing or triggering CI — see the absolute local-boundary rule above.

## Caveman

Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".

- Never put multiple components in the same file unless the file is intentionally using the Composition pattern. When a parent component needs private child components, turn it into a folder with `index.tsx`, move each child component to its own file, and place shared local types in `types.ts`.
- Always add ShadCN components through the ShadCN CLI.

## TanStack Router — Route File Convention

**Always use folder/index structure — never dot notation for multi-segment paths.**

```
✅ sports/$sportKey/events/$eventId.tsx
❌ sports.$sportKey.events.$eventId.tsx
```

- Nested route → create a folder, put page in `index.tsx` or a named file inside
- Layout-only files that just render `<Outlet />` can be omitted entirely — TanStack Router infers hierarchy from file names
- When moving files deeper, update all relative imports (depth increases, so `./components` → `../../components` etc.)
- After any route file change, rebuild so `routeTree.gen.ts` regenerates

## TanStack Router — File-Based Route Nesting

**A route file is a layout if it has child routes; it must render `<Outlet />`.** When a page (`foo.$param.tsx`) gains a child route (`foo.$param.bar.tsx`), convert the parent into a layout immediately:

1. Replace the parent's content with `component: () => <Outlet />` (no `beforeLoad`).
2. Move the original page content to `foo.$param.index.tsx` with route path `"…/$param/"` (trailing slash) and restore its `beforeLoad`.

This is the same pattern used for `challenges.$challengeId` → `challenges.$challengeId.index` + `challenges.$challengeId.terms`. Failing to do this makes child routes silently never render.

**Never add a page component to a route file that also has child routes.** If you need both a parent page and children, you need three files: the layout (`$param.tsx`), the index (`$param.index.tsx`), and the child (`$param.child.tsx`).

## Component Architecture (Frontend)

- **Loading states before empty/error states.** While any request required to decide what a screen should render is pending, render skeletons that mirror the final content's dimensions and structure as closely as possible. Never infer "not found", "unavailable", or an empty collection from `undefined` data before the relevant request settles. Check `isPending`/`isLoading` first, then request errors, then settled empty/not-found states. When a screen depends on multiple requests, keep its skeleton until all required requests settle. Avoid generic spinner-only or one-block placeholders when shaped skeletons can preserve layout.
- **Simple, componentized components.** Break out parts that make sense into their own components — avoid bloated components with multiple responsibilities.
- **Shared form fields.** When create and edit forms repeat field groups, extract one shared field component and pass their small variations as props (for example, an optional product select or layout width). Never copy input markup between these forms.
- **Maximize reuse — design-system mindset.** Aggressively extract primitives (Container, Section, IconBadge, CheckList, BrandMark, SectionHeading, etc.) whenever a layout/presentation pattern repeats, even within a single page. Generic primitives go in [frontend/src/components/ui/](frontend/src/components/ui/); domain composites go in `frontend/src/components/<feature>/`. When in doubt, extract.
- **Inline table editing preserves exact geometry.** Entering edit mode must not change column widths, row structure, alignment, or overall table layout. Replace each displayed value one-for-one inside the same `<td>`; never merge cells, add `colSpan`, move values between columns, or change cell padding. Size editors within existing cells and neutralize/offset editor padding so editable text begins on the exact same baseline and horizontal position as display text. Keep action groups inside the existing action column.
- **Modal listings separate viewing from editing.** Default to a compact read-only row/card so users can scan and reorder many records. Show key data only: image thumbnail, name, short description, price/value, availability indicator, drag handle when sortable, plus icon-only Edit/Delete actions (with `aria-label` and `Tooltip`). Do not keep all fields editable in every listing row. Use a submodal when editing has enough fields to make the listing modal crowded. Every edit modal must provide explicit `Salvar` and `Descartar` actions; discard restores state from before opening and closes without retaining edits.
- **Modal sections collapse to title and summary.** Long modal sections must be individually collapsible. When collapsed, show the section title and one concise summary only; expanding reveals the editable content. For a unit address, the summary is the full formatted address.
- **Component file naming in CamelCase (PascalCase).** Component files use PascalCase: `AuthTabs.tsx`, `LoginForm.tsx`, `FormField.tsx`. Files that are not components (utils, hooks, configs) stay in kebab-case.
- **Page component co-location.** If a component is only used by one page (or a single parent component), place it in a `components/` folder adjacent to the file that uses it. Always create an `index.ts` barrel inside that folder. Example: `app/auth/components/AuthTabs.tsx` + `app/auth/components/index.ts`.
- **Fetch data in the deepest possible component.** The request belongs in the component that actually consumes the data. Only lift it to the parent if another sibling also needs the same data.
- **Server Components by default.** Keep `"use client"` at the smallest possible scope — only add it when there is state, an effect, an event handler, or a browser API.
- **No `React.` namespace.** Never use `import * as React from "react"` or qualify types/hooks with `React.X`. Import everything by name: `import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react"`. `FormEvent`/`FormEventHandler` are deprecated in current typings — prefer an inline `onSubmit` handler so the type is inferred.
- **No `<input type="number">`.** Numeric inputs are better implemented as `type="text"` with explicit parsing and validation — `type="number"` has poor UX (scroll-to-change, inconsistent browser behavior, broken paste). Use `inputMode="numeric"` or `inputMode="decimal"` for mobile keyboard hints, parse the value with `parseFloat`/`parseInt` on change or blur, and store it as a string in local state until submission.
- **Always add masks and placeholders.** Every input that accepts a structured value (currency, percentage, date, phone, document number) must use a formatting mask — prefer `NumericFormat` from `react-number-format` for monetary/numeric fields (e.g. `prefix="R$ "`, `thousandSeparator="."`, `decimalSeparator=","`, `suffix="%"`). Every input and textarea must have a `placeholder` that shows a realistic example of the expected format (e.g. `"R$ 10.000,00"`, `"Ex: Plano Starter"`). Placeholder text must always use a more muted color than normal input text. Raw bare inputs with no context are not acceptable.
- **Always provide autofill metadata where applicable.** Every input whose purpose has a standard browser autocomplete token must use that `autoComplete` value plus a stable semantic `name`. Payment fields use `cc-name`, `cc-number`, `cc-exp`, and `cc-csc`; identity/contact/address fields use the corresponding standard token. Do not disable autocomplete for fields that password managers or browser autofill can fill. When wrapping or masking an input, verify that `name` and `autoComplete` reach the native `<input>`.
- **Always debounce text inputs.** Every `<input type="text">` and `<textarea>` must use `useDebouncedInput` from `@/hooks/use-debounced-input` — it keeps a local state that updates immediately (preserving the browser's native undo/Ctrl+Z history) and debounces the parent `onChange` callback (default 300 ms). Without this, each keystroke triggers a parent re-render that resets the browser undo stack. Pattern: `const [local, setLocal] = useDebouncedInput(form.field, v => set("field", v));` then bind `value={local}` and `onChange={e => setLocal(e.currentTarget.value)}`. For list rows, extract a row component so each row has its own local state.
- **Confirm only permanent destructive actions inline.** Native `alert()` and `confirm()` remain forbidden. Never use `showConfirm` for UI actions. Require confirmation only for irreversible consequences, such as deleting a product. The first click must open an anchored tooltip with confirmation text, replace its icon/text with an explicit confirmation control, and require a second click to execute. Confirmation expires after three seconds. Idle buttons retain their normal hover tooltip. Use `ConfirmActionButton` from `@/components/ui/ConfirmActionButton`. Preserve original button geometry: text-only stays text-only, icon-only stays icon-only, icon-plus-text keeps both. Reversible actions, including activating or deactivating coupons, execute on the first click and show a toast. Use `showAlert` only for blocking non-confirmation errors.
- **Toast every button with a side effect.** Any button that mutates state without navigating or opening a form — restoring defaults, copying a value from elsewhere, duplicating a record, clearing a cache, etc. — must confirm the action with `showToast(message, kind)` from `@/stores`. Without visible feedback the user can't tell whether the click did anything, especially when the visual result is subtle (e.g. copying one theme's colors onto another). Use `"info"` for neutral confirmations (copy/restore), `"positive"`/`"negative"` for outcomes that can fail. This is in addition to, not instead of, the `showAlert`/`showConfirm` rule above — those are for blocking dialogs, this is for fire-and-forget confirmations.
- **No native `<select>`.** Native selects have inconsistent cross-browser styling and a cramped arrow affordance. Always use `CustomSelect` from `@/components/ui/CustomSelect` instead — it renders a `<button>` trigger with a portal-based popover (`createPortal` + `position: fixed`) so it escapes `overflow: hidden/auto` containers (e.g. modals). Never wrap `CustomSelect` in a `<label>`; use a `<div>` with the label text above it since the trigger is a button, not an input.
- **No ghost (borderless) buttons.** Never render a button without a visible border. A ghost/borderless button is invisible at rest — users can't tell it's interactive. Always use `variant: "outline"` for secondary/subtle actions; reserve `variant: "ghost"` only for icon-only toolbar buttons where the icon itself communicates interactivity, and even then ensure a clear hover background.
- **Scrollbars follow the theme.** Never leave a native browser scrollbar visible. Any component that can overflow — horizontally or vertically — must use the themed scrollbar: wrap the overflowing element in `ScrollArea` from `@/components/ui/ScrollArea` (applies `scrollbar-themed`), or, for elements needing a hidden-until-hover treatment (e.g. `Modal`), use `scrollbar-none` paired with the `Scrollbar` overlay component. Never add a bare `overflow-x-auto`/`overflow-y-auto`/`overflow-auto`/`overflow-scroll` class without one of these.
- **Clickable controls use pointer cursor.** Unless explicitly defined otherwise, every clickable control must show `cursor-pointer` on hover. Preserve `disabled:cursor-not-allowed` for disabled controls. This includes buttons, custom-select triggers/options, labels that toggle checkboxes, and selectable modal rows.
- **Checkboxes use established custom component.** Never render a raw `<input type="checkbox">` in product UI. Use `Checkbox` from `@/components/ui/Checkbox` so all checkbox controls retain established design.
- **Sortable lists use animated `dnd-kit` sorting.** Every reorderable list of groups, rows, or cards must use `DndContext` + `SortableContext` from `dnd-kit`; native HTML `draggable` is forbidden for list sorting. The full item must follow the pointer with reduced opacity, while surrounding items animate out of the way in real time to preview the insertion order before drop. Use a visible drag-handle icon as the only pointer activator (never a numeric order field), configure pointer and keyboard sensors, restrict movement to the list's vertical axis and existing bounds with the shared `verticalListModifiers`, and persist normalized `sortOrder` values on drag end. Dragging must never create horizontal scrolling or extend vertical scrolling beyond the list's normal content height. Dragging an expanded group collapses it; dropping restores its previous expanded state. Cross-column workflows such as kanban and file-drop targets are not sortable lists and may use purpose-specific drag behavior.
- **Portuguese pluralization uses CLDR keys.** For `pt-BR`, define and call `_one` only for exactly `1`; define and call `_other` for `0` and every other count. Never treat zero as singular.
- **Disclosure labels use standard terms.** Toggle labels must use `Expandir` when closed and `Minimizar` when open. Avoid alternate wording such as "recolher".
- **Row action buttons get an icon; collapse to icon-only past a handful.** Any action button that isn't an essential Cancel/Save (e.g. table row actions like Editar, Configurar, Excluir) should be paired with a `react-icons/lu` icon alongside its label. When a row accumulates many actions (roughly 5+, e.g. a units table with Cardápio/Configurar/Endereço/Banner/Horários/Entrega/Excluir), drop the visible label entirely — render `size="icon"` buttons with just the icon, an `aria-label` for accessibility, and wrap each in `Tooltip` from `@/components/ui/Tooltip` so the label surfaces on hover/focus instead. This keeps wide action rows from overflowing while staying discoverable. See `frontend/src/routes/admin/units/components/UnitsTable.tsx` for the icon-only pattern and `frontend/src/routes/admin/products/components/ProductRow.tsx` for the icon+label pattern used when there are only a few actions.
- **Mark required fields with an asterisk.** Any field the user must fill before submitting (HTML `required`, or otherwise gating the submit button, e.g. `disabled={!name}`) must show a destructive-colored `*` next to its label — this is standard form UX and lets users spot what's missing without a failed submit. Use `RequiredMark` from `@/components/ui/label`. Since `Label` is a CSS grid where each direct child becomes its own row, wrap the label text and the mark together in one element so they render on the same line: `<span>{t("field.label")} <RequiredMark /></span>` as the first child, followed by the input.
- **Collapse multi-row create forms above a listing.** When a page has a multi-row create/associate form at the top and a listing below (e.g. `/admin/products`, `/admin/units`), the form must collapse to show only its **first row and that row's labels** — every row and section heading _beyond_ the first collapses. It expands on hover, on focus (`focus-within`), or whenever any of its inputs holds state (so a half-filled form never collapses out from under the user). Use `CollapsibleFormSection` from `@/components/ui/CollapsibleFormSection` to wrap the rows past the first, passing `expanded={hasData}` where `hasData` is a `useMemo` over all field values; the parent `<form>` must carry the `group` class (and lay rows out with `space-y-*`, not a single form-wide grid, so the collapsed region can be a distinct block). Any section heading (`FormSectionHeading`) that belongs to a collapsed row goes _inside_ the `CollapsibleFormSection`, never above it — only the first row's heading stays visible. The submit button stays visible in the always-shown footer.

## Auth Guards — Never Conflate Rate Limiting with Unauthenticated

`requireStaffBeforeLoad` ([frontend/src/lib/staff-guard.ts](frontend/src/lib/staff-guard.ts)) and its super-admin equivalent ([frontend/src/lib/super-admin-guard.ts](frontend/src/lib/super-admin-guard.ts)) redirect to `/login` whenever `authClient.getSession()` returns no user — but that call returns `data: null` both when the session is genuinely missing/expired AND when the underlying request was rate-limited (HTTP 429). A 429 must never be treated as "not authenticated": redirecting to login on a 429 forces the user to log back in for something that isn't an auth problem, and masks the real rate-limit issue.

When touching these guards (or any other code that decides to redirect to `/login` based on a failed session/auth request), inspect the actual HTTP status of the underlying response before redirecting:
- 401/403 (or a genuinely empty session) → redirect to `/login`, as today.
- 429 → do **not** redirect to login; surface a rate-limit message/retry instead (e.g. via `showAlert`), or retry after a backoff, but keep the user on the current route.

## Backend DTOs (Elysia / TypeBox)

**DTOs are always TypeBox schemas, never TypeScript interfaces.** The type is derived with `typeof XxxDTO.static`:

```ts
// ✅ correct
export const CreateReceiptDTO = t.Object({
    ...CreateReceiptBody.properties,
    companyId: t.Optional(t.String()),
    filename: t.String(),
    userId: t.String(),
});
export type CreateReceiptDTO = typeof CreateReceiptDTO.static;

// ❌ avoid
export interface CreateReceiptDTO {
    companyId?: string;
    filename: string;
    // ...
}
```

To compose DTOs, use a single `t.Object` with a `.properties` spread — **never** `t.Intersect`:

```ts
// ✅ correct
export const ListPriceAlertsDTO = t.Object({ ...ListPriceAlertsQuery.properties, userId: t.String() });

// ❌ avoid
export const ListPriceAlertsDTO = t.Intersect([ListPriceAlertsQuery, t.Object({ userId: t.String() })]);
```

`t.Intersect` produces poorly resolved runtime types during validation; the `.properties` spread produces a correct flat schema.

### DTO Naming vs. Elysia Option

- **Return DTO**: name it `XxxReturn` or `XxxResult` — it reflects the use-case domain, without knowledge of HTTP infrastructure.
- **Elysia controller**: pass the DTO under the `response:` key, **never** `result:`.

```ts
// ✅ correct — the Elysia key is "response"
.get("/revenue", handler, { response: GetRevenueReturn })

// ❌ wrong — "result" is not recognized by Elysia; it generates `any` types in Kubb
.get("/revenue", handler, { result: GetRevenueReturn })
```

Using `result:` makes Elysia ignore the response typing, which makes Kubb generate `XxxQueryResponse = any` in the generated SDK.

## Frontend SDK — Mandatory Rule

**Never edit files inside `frontend/src/lib/api/generated/`.** They are completely overwritten on every regeneration.

Correct flow when adding or changing an endpoint:
1. Change the backend (controller/DTO).
2. `bun run export` in the backend → updates `backend/generated/openapi.json` and `generateOpenApi.ts`.
3. `bun run generate` in the frontend → regenerates the SDK in `generated/`.

If you need a hook for an endpoint that is not yet available on the production server, place it in `frontend/src/lib/api/` (outside `generated/`) and re-export it through `frontend/src/lib/api/index.ts`.

## i18n — Mandatory Rule

The translation files in [frontend/src/i18n/locales/](frontend/src/i18n/locales/) **must remain synchronized**. Today only `en-US.json` exists.

**Every time you add, rename, or remove a key, apply the change to ALL locale files in the same operation.** Never leave one locale behind another, even if the final translation still needs review — in that case, use the fallback-language string as a placeholder and leave a comment in the PR, but ensure the key structure is identical across files.

- The fallback locale is the ground truth for types (see [frontend/src/i18n/types.d.ts](frontend/src/i18n/types.d.ts)).
- Keys inside JSON files follow alphabetical order (linter rule).
- When introducing a new namespace, register it in [frontend/src/i18n/config.ts](frontend/src/i18n/config.ts) and in `types.d.ts`.

### Enums Are Frontend-Translatable Contracts

Backend status/error enums (e.g. KYC status, bet status, payout status, error codes) exist to give the frontend predictability: the frontend translates the enum value, it never renders the raw value to the user. Whenever you add or change an enum member on the backend, add the matching translation key to **all** locale files in the same change, and render it through `t()` with the raw value as `defaultValue` (e.g. ``t(`kyc.status.${user.kycStatus}`, { defaultValue: user.kycStatus })``). Never render a raw enum value in the UI.

## Test File Placement

- **Unit tests** live **next to the file under test** — `Foo.ts` → `Foo.test.ts` in the same directory.
- **Integration / E2E tests** (multiple units, DB, or cross-module flows) live in a `tests/` folder within the relevant module.
- **Never** name the folder `__tests__` (or any `__…__` form). The folder is always plainly named `tests`.
- Backend runs on Bun: tests use `bun:test` and `bun test`.
