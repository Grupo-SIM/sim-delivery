# Admin UI → shadcn Migration — Design

## Goal

Migrate all admin UI (`frontend/src/routes/admin/**`) from hand-rolled primitives to shadcn/ui, where a direct shadcn equivalent exists. Domain-specific components with no shadcn equivalent are left structurally unchanged.

## Current state

- No `components.json` — shadcn CLI has never been initialized in `frontend/`.
- `frontend/src/globals.css` already defines shadcn-compatible CSS variables (`--background`, `--primary`, `--border`, `--ring`, etc.), currently mapped to a monochrome (black/white/gray) brand palette. Both `:root` and `.dark` blocks are populated.
- `frontend/src/lib/utils.ts` already exports `cn()` identical to shadcn's own utility.
- Some shadcn-style primitives already exist in `frontend/src/components/ui/` (lowercase filenames: `button.tsx`, `card.tsx`, `badge.tsx`, `alert.tsx`, `input.tsx`, `label.tsx`) — these were hand-authored to shadcn conventions, not added via CLI. They should be re-added via CLI where practical to get canonical implementations, or left alone if functionally identical (judgment call per component during implementation).
- Custom PascalCase primitives with shadcn equivalents: `Modal.tsx`, `ConfirmDialog.tsx`, `CustomSelect.tsx`, `AppButton.tsx`, `BrandButton.tsx`, `DataTable.tsx`, `Tooltip.tsx`.
- Verified during brainstorming: shadcn CLI (`bunx shadcn@latest`) and the component registry (`ui.shadcn.com`) are both reachable from this environment.

## Non-goals

- No change to domain-specific components with no shadcn equivalent: `CollapsibleFormSection`, `ColorField/*`, `NumericInput`, `TextField`, `StatCard`, `IconBadge`, `Panel`, `Section`, `EmptyState`, `ErrorState`, `GradientCard`, `Container`, `Skeleton`, `DisplayHeading`, `SectionHeading`, `FormSectionHeading`, `MediaUrlInput`, `BrandMark`. These may get incidental class-name touch-ups only if a neighboring shadcn swap breaks visual consistency, but no structural rewrite.
- No change to brand palette/theme values themselves.
- No change to storefront UI (`frontend/src/routes/_storefront/**`) — admin only.
- No behavior change: existing AGENTS.md rules (debounced inputs, currency/date masks, no native `<select>`/`alert()`/`confirm()`, icon-only row actions past ~5, required-field asterisks, no ghost buttons) all continue to apply verbatim — the shadcn swap is a primitive-level implementation change, not a UX rule change.

## Component mapping

| Custom component | shadcn replacement | Notes |
|---|---|---|
| `Modal.tsx` | `Dialog` | Base primitive; several domain modals build on it (`ProductUnitsModal`, `UnitProductEditModal`, `CategoryEditModal`, `AssignCourierModal`, `UpdateStatusModal`) |
| `ConfirmDialog.tsx` | `AlertDialog` | Preserve the imperative `showAlert()`/`showConfirm()` API from `@/stores` (dialog store) — only the rendered primitive changes |
| `CustomSelect.tsx` | `Select` | Radix `Select` provides its own portal/positioning; drop the hand-rolled portal logic |
| `AppButton.tsx` / `BrandButton.tsx` | `Button` (existing `button.tsx`) | Resolve duplication during implementation: diff their usage/props against `button.tsx`'s variants and consolidate onto one |
| `DataTable.tsx` + per-section `*Table.tsx` / `*Row.tsx` | shadcn `Table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) | Largest chunk — touches every admin section. Editable-row layout-preservation rule (AGENTS.md) must hold through the swap |
| `Tooltip.tsx` | shadcn `Tooltip` | Used for icon-only row actions |
| Any hand-rolled dropdown/kebab menu found during implementation | `DropdownMenu` | Confirm existence per-section; not currently confirmed to exist |

## Phases

Each phase is one plan step and one atomic commit (`feat(frontend)` scope), verified independently before moving to the next.

0. **Foundation** — `bunx shadcn@latest init` (style `new-york`, base color `neutral`), then `add dialog alert-dialog select table tooltip dropdown-menu`. Rewire `ConfirmDialog` onto `AlertDialog`. No consumer changes yet.
1. **Simple CRUD sections** — `tags`, `companies`, `staff`. Smallest tables/forms; establishes the Table/Select/Dialog replacement pattern at low risk.
2. **Complex sections** — `products`, `units` (incl. `units/$unitId/products`), `categories`. DnD boards (`CategoriesBoard`, `UnitCategoryColumn`), nested modals, multi-row collapsible forms.
3. **Operational sections** — `orders`, `kitchen`. Kanban cards, status badges, assign/update-status modals.
4. **Remaining sections** — `branding`, `reports`, `reviews`.
5. **Sweep** — delete any custom component with zero remaining consumers (`Modal`, `CustomSelect`, `AppButton`/`BrandButton` duplicate, old `DataTable`); grep for stray imports.

## Migration pattern (per file)

Swap the import and JSX to the shadcn primitive directly — no compatibility wrapper. Keep existing Tailwind classes, debounce hooks, masks, icon+label/icon-only action rules, and required-field asterisks exactly as they are; only the underlying primitive changes.

## Verification

After each phase: `bun run check-types` and `bun run build` scoped to `frontend`, plus a manual click-through of that phase's admin pages in the dev server (create/edit/delete flows, modals open/close, select dropdowns, tooltips on icon-only actions).

## Risks

- `AppButton` vs `BrandButton` duplication is unresolved — implementation must inspect actual call sites before deciding which survives.
- shadcn `init` may attempt to rewrite `globals.css`/tailwind config; since tokens are already shadcn-shaped, expect the CLI to mostly no-op here, but the diff must be reviewed before accepting, not blindly applied.
- Table migration is the highest-churn item — touches nearly every admin route — and is the main driver of the phase-by-section split rather than a single big-bang swap.
