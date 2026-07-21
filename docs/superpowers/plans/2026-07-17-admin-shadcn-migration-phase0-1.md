# Admin shadcn Migration — Phase 0 (Foundation) + Phase 1 (Tags/Companies/Staff) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize shadcn/ui in `frontend/`, install the primitives the whole admin migration will need (Dialog, AlertDialog, Select, Table, Tooltip, DropdownMenu), rewire the app-wide `ConfirmDialog` onto `AlertDialog`, and migrate the three simplest admin sections (tags, companies, staff) from the hand-rolled `DataTable`/`CustomSelect` to shadcn's `Table`/`Select`.

**Architecture:** shadcn components are added via its CLI (`bunx shadcn@latest add ...`) into `frontend/src/components/ui/`, never hand-authored, per `AGENTS.md`. Each admin section's `*Table.tsx` + `*Row.tsx` pair swaps raw `<table>`/`<tr>`/`<td>` markup for the generated `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell` components; `CustomSelect` usages swap for `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`. `DataTable.tsx` (no shadcn equivalent — it's just a bordered/rounded card wrapper) is simplified to a plain div wrapper since shadcn's own `Table` already provides its own scroll container.

**Tech Stack:** shadcn CLI `4.13.1` (registry-based, Radix base — confirmed reachable: `bunx shadcn@latest --version` → `4.13.1`, `https://ui.shadcn.com/r/styles/new-york/button.json` → `200`), Radix UI primitives, Tailwind v4, React 19, Bun workspaces + Turbo.

**Full design context:** [docs/superpowers/specs/2026-07-17-admin-shadcn-migration-design.md](../specs/2026-07-17-admin-shadcn-migration-design.md). This plan covers only Phase 0 + Phase 1 of that spec's 6 phases; Phases 2–5 (products/units/categories, orders/kitchen, branding/reports/reviews, final sweep) each get their own plan doc written when reached.

**Important CLI note:** this shadcn CLI version (`4.13.1`) is a newer registry-based rewrite. It does **not** have the classic `--style`/`--base-color` flags described in older shadcn docs — `init` instead takes `-b/--base <base>` (`base`, `radix`, or `aria` — the underlying primitive library) and `-t/--template <template>`. This plan uses `-b radix` because the project already depends on `@radix-ui/react-dialog` and `@radix-ui/react-slot` directly.

---

### Task 0: Initialize shadcn CLI

**Files:**
- Create: `frontend/components.json`
- Modify (verify only, revert if it touches brand tokens): `frontend/src/globals.css`
- Modify: `frontend/package.json`, `bun.lock` (new deps)

- [ ] **Step 1: Run init**

Run from repo root:
```bash
cd frontend && bunx shadcn@latest init -y -b radix -t vite
```
Expected: creates `frontend/components.json`, prints a summary of files written/skipped. It should **not** need to touch `globals.css` since the file already defines every CSS variable the `radix` base style expects (`--background`, `--primary`, `--border`, `--ring`, etc. — see the design spec's "Current state" section).

- [ ] **Step 2: Review the diff before keeping it**

```bash
git status
git diff -- frontend/src/globals.css
```
Expected: `components.json` is new/untracked. If `globals.css` shows any diff, read it — if it only adds variables that don't already exist (harmless), keep it; if it overwrites `--primary`/`--background`/etc. brand values back to shadcn defaults, revert just that file with `git checkout -- frontend/src/globals.css` and keep `components.json` as-is (the vars it needs already exist).

- [ ] **Step 3: Commit**

```bash
git add frontend/components.json frontend/package.json bun.lock
git -c commit.gpgsign=false commit -m "chore(frontend): initialize shadcn/ui CLI"
```

---

### Task 1: Add the primitives this migration needs

**Files:**
- Create: `frontend/src/components/ui/dialog.tsx`
- Create: `frontend/src/components/ui/alert-dialog.tsx`
- Create: `frontend/src/components/ui/select.tsx`
- Create: `frontend/src/components/ui/table.tsx`
- Create: `frontend/src/components/ui/tooltip.tsx`
- Create: `frontend/src/components/ui/dropdown-menu.tsx`
- Modify: `frontend/package.json`, `bun.lock` (new `@radix-ui/*` deps)

- [ ] **Step 1: Add components**

```bash
cd frontend && bunx shadcn@latest add dialog alert-dialog select table tooltip dropdown-menu -y
```
Expected: six new files under `frontend/src/components/ui/`, new `@radix-ui/react-select`, `@radix-ui/react-tooltip`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-alert-dialog` deps added to `frontend/package.json`.

- [ ] **Step 2: Confirm it didn't overwrite the existing hand-authored primitives**

```bash
git status
```
Expected: no changes to `frontend/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `alert.tsx`, `input.tsx`, `label.tsx` (the CLI skips files that already exist unless `-o/--overwrite` is passed, which was not used). Only the six new files should appear.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/dialog.tsx frontend/src/components/ui/alert-dialog.tsx frontend/src/components/ui/select.tsx frontend/src/components/ui/table.tsx frontend/src/components/ui/tooltip.tsx frontend/src/components/ui/dropdown-menu.tsx frontend/package.json bun.lock
git -c commit.gpgsign=false commit -m "feat(frontend): add shadcn dialog, alert-dialog, select, table, tooltip, dropdown-menu primitives"
```

---

### Task 2: Export `buttonVariants` from `button.tsx`

The generated `alert-dialog.tsx` styles its `AlertDialogAction`/`AlertDialogCancel` by importing `buttonVariants` from the button component. The existing hand-authored `button.tsx` defines this `cva` call but never exports it — only exports the derived `buttonClassName`/`buttonBaseClassName` helpers. Without this export, `alert-dialog.tsx` fails to compile.

**Files:**
- Modify: `frontend/src/components/ui/button.tsx:5`

- [ ] **Step 1: Export the const**

In `frontend/src/components/ui/button.tsx`, change:
```ts
const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90", destructive: "border-transparent bg-destructive text-primary-foreground hover:bg-destructive/90", ghost: "border-transparent bg-transparent text-foreground hover:bg-muted", outline: "border-border bg-transparent text-foreground hover:bg-muted", secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90" }, size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "size-9" } }, defaultVariants: { variant: "default", size: "md" } });
```
to:
```ts
export const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90", destructive: "border-transparent bg-destructive text-primary-foreground hover:bg-destructive/90", ghost: "border-transparent bg-transparent text-foreground hover:bg-muted", outline: "border-border bg-transparent text-foreground hover:bg-muted", secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90" }, size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "size-9" } }, defaultVariants: { variant: "default", size: "md" } });
```
(only the leading `export` keyword is added — no other change).

- [ ] **Step 2: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS (or, if `alert-dialog.tsx`'s import of `buttonVariants` was resolved differently by the CLI, this step surfaces that immediately — inspect `frontend/src/components/ui/alert-dialog.tsx`'s import line and adjust the export name to match exactly).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/button.tsx
git -c commit.gpgsign=false commit -m "fix(frontend): export buttonVariants for shadcn alert-dialog"
```

---

### Task 3: Rewire `ConfirmDialog` onto `AlertDialog`

**Files:**
- Modify: `frontend/src/components/ui/ConfirmDialog.tsx`

- [ ] **Step 1: Replace the implementation**

Full new contents of `frontend/src/components/ui/ConfirmDialog.tsx`:
```tsx
import { LuCircleAlert } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDialogStore } from "@/stores/dialog";

export function ConfirmDialog() {
	const { t } = useTranslation();
	const { close, current } = useDialogStore();
	if (!current) return null;

	const confirm = current.type === "confirm";
	const title = current.title ?? t(confirm ? "actions.confirm" : "actions.attention", { defaultValue: "Atenção" });

	return (
		<AlertDialog
			onOpenChange={open => {
				if (!open) close(false);
			}}
			open
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-3">
						<span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
							<LuCircleAlert className="size-5" />
						</span>
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="whitespace-pre-line text-muted-foreground text-sm leading-6">
						{current.message}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					{confirm && (
						<AlertDialogCancel onClick={() => close(false)}>{t("actions.cancel")}</AlertDialogCancel>
					)}
					<AlertDialogAction autoFocus onClick={() => close(true)}>
						{confirm ? (current.confirmLabel ?? t("actions.confirm")) : t("actions.ok")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
```

- [ ] **Step 2: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS.

- [ ] **Step 3: Manual verification**

```bash
cd frontend && bun run dev
```
Open any admin page with a delete action (e.g. `/admin/tags`), trigger a delete to confirm `showConfirm()` still renders correctly, Cancel closes without deleting, Confirm proceeds. Trigger any `showAlert()` path (e.g. a failed request) to confirm the alert variant (no Cancel button, single OK) also renders correctly. Stop the dev server after.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/ConfirmDialog.tsx
git -c commit.gpgsign=false commit -m "refactor(frontend): rewire ConfirmDialog onto shadcn AlertDialog"
```

---

### Task 4: Delete dead `AppButton.tsx`

Confirmed via `grep -r "AppButton" frontend/src` during brainstorming: the only match is the file's own definition — zero consumers anywhere in the codebase. It predates `BrandButton` (used only in `frontend/src/routes/design-kit/index.tsx`, out of admin scope) and `button.tsx` (the real shadcn `Button`, used everywhere in admin). This is plain dead code, not a migration target.

**Files:**
- Delete: `frontend/src/components/ui/AppButton.tsx`

- [ ] **Step 1: Confirm zero consumers still holds**

```bash
grep -rn "AppButton" frontend/src --include="*.tsx" --include="*.ts"
```
Expected: only `frontend/src/components/ui/AppButton.tsx` itself matches (its own `export function AppButton`). If any other file matches, stop — do not delete, re-scope this task by migrating that consumer to `Button` first.

- [ ] **Step 2: Delete**

```bash
rm frontend/src/components/ui/AppButton.tsx
```

- [ ] **Step 3: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src/components/ui/AppButton.tsx
git -c commit.gpgsign=false commit -m "chore(frontend): delete unused AppButton component"
```

---

### Task 5: Simplify `DataTable.tsx` to a plain card wrapper

shadcn's generated `Table` component already renders its own `overflow-x-auto` scroll container around the `<table>` element, so `DataTable` no longer needs to render `<table>` itself — it becomes a bordered/rounded/bg-card `<div>` that any section's `Table` sits inside. The `tableClassName` prop (previously used by `CompaniesTable` to pass `table-fixed`) is dropped — table-level classes now go directly on the `<Table>` component.

**Files:**
- Modify: `frontend/src/components/ui/DataTable.tsx`

- [ ] **Step 1: Replace the implementation**

Full new contents of `frontend/src/components/ui/DataTable.tsx`:
```tsx
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
}

export function DataTable({ children, className, ...props }: DataTableProps) {
	return (
		<div className={cn("overflow-x-auto rounded-md border border-border bg-card", className)} {...props}>
			{children}
		</div>
	);
}
```

- [ ] **Step 2: Commit alongside Task 6** (this file has no direct consumers left working until the table sections are migrated in the same commit — see Task 6).

---

### Task 6: Migrate the `tags` section

**Files:**
- Modify: `frontend/src/routes/admin/tags/components/TagsTable.tsx`
- Modify: `frontend/src/routes/admin/tags/components/TagRow.tsx`

- [ ] **Step 1: Rewrite `TagsTable.tsx`**

Full new contents:
```tsx
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GetTags200 } from "@/lib/api";
import { TagRow } from "./TagRow";

interface TagsTableProps {
	tags: GetTags200;
}

export function TagsTable({ tags }: TagsTableProps) {
	const { t } = useTranslation();

	if (tags.length === 0) {
		return <EmptyState title={t("admin.tags.empty")} />;
	}

	return (
		<DataTable>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("admin.tags.columns.name")}</TableHead>
						<TableHead>{t("admin.tags.columns.color")}</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{tags.map(tag => (
						<TagRow key={tag.id} tag={tag} />
					))}
				</TableBody>
			</Table>
		</DataTable>
	);
}
```

- [ ] **Step 2: Rewrite `TagRow.tsx`**

Full new contents:
```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/ui/ColorField";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetTags200, getTagsQueryKey, useDeleteTagsByTagId, usePatchTagsByTagId } from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";

interface TagRowProps {
	tag: GetTags200[number];
}

export function TagRow({ tag }: TagRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(tag.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [color, setColor] = useState(tag.color);
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePatchTagsByTagId();
	const remove = useDeleteTagsByTagId();

	const invalidate = () => queryClient.invalidateQueries({ queryKey: getTagsQueryKey() });

	function save() {
		flushName();
		setError(null);
		mutate(
			{ data: { color, name: localName }, tagId: tag.id },
			{
				onError: () => setError(t("admin.tags.edit.error")),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
				},
			},
		);
	}

	async function del() {
		if (!(await showConfirm(t("admin.tags.row.deleteConfirm", { name: tag.name })))) {
			return;
		}
		remove.mutate(
			{ tagId: tag.id },
			{
				onError: () => void showAlert(t("admin.tags.row.deleteError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	if (!editing) {
		return (
			<TableRow>
				<TableCell className="font-medium">{tag.name}</TableCell>
				<TableCell>
					<span className="inline-flex items-center gap-2 text-muted-foreground">
						<span
							aria-hidden
							className="inline-block h-4 w-4 rounded-full border border-border"
							style={{ backgroundColor: tag.color }}
						/>
						{tag.color}
					</span>
				</TableCell>
				<TableCell className="text-right">
					<div className="flex justify-end gap-2">
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							{t("admin.tags.edit.action")}
						</Button>
						<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
							{t("admin.tags.row.delete")}
						</Button>
					</div>
				</TableCell>
			</TableRow>
		);
	}

	return (
		<TableRow>
			<TableCell>
				<Input
					onBlur={flushName}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.tags.create.namePlaceholder")}
					value={localName}
				/>
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</TableCell>
			<TableCell>
				<ColorField onChange={setColor} value={color} />
			</TableCell>
			<TableCell>
				<div className="flex justify-end gap-2">
					<Button
						disabled={isPending}
						onClick={() => {
							setName(tag.name);
							setColor(tag.color);
							setError(null);
							setEditing(false);
						}}
						size="sm"
						type="button"
						variant="outline"
					>
						{t("admin.tags.edit.cancel")}
					</Button>
					<Button disabled={isPending || !localName} onClick={save} size="sm" type="button">
						{isPending ? t("admin.tags.edit.saving") : t("admin.tags.edit.save")}
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}
```

- [ ] **Step 3: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS.

- [ ] **Step 4: Manual verification**

```bash
cd frontend && bun run dev
```
Open `/admin/products` (tags route redirects there with `?tab=tags` — see `frontend/src/routes/admin/tags/index.tsx:31-34`) or navigate to wherever the tags tab is rendered. Confirm: table renders, edit toggles a row into inputs without layout shift, save/cancel work, delete asks for confirmation (via the `AlertDialog` from Task 3) and removes the row. Stop the dev server after.

- [ ] **Step 5: Commit (includes Task 5's `DataTable.tsx` change)**

```bash
git add frontend/src/components/ui/DataTable.tsx frontend/src/routes/admin/tags/components/TagsTable.tsx frontend/src/routes/admin/tags/components/TagRow.tsx
git -c commit.gpgsign=false commit -m "refactor(frontend): migrate tags admin table to shadcn Table"
```

---

### Task 7: Migrate the `companies` section

**Files:**
- Modify: `frontend/src/routes/admin/companies/components/CompaniesTable.tsx`
- Modify: `frontend/src/routes/admin/companies/components/CompanyRow.tsx`

- [ ] **Step 1: Rewrite `CompaniesTable.tsx`**

Full new contents:
```tsx
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GetCompanies200 } from "@/lib/api";
import { CompanyRow } from "./CompanyRow";

interface CompaniesTableProps {
	companies: GetCompanies200;
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
	const { t } = useTranslation();

	if (companies.length === 0) {
		return <EmptyState title={t("admin.companies.empty")} />;
	}

	return (
		<DataTable>
			<Table className="table-fixed">
				<colgroup>
					<col />
					<col />
					<col className="w-40" />
					<col className="w-52" />
				</colgroup>
				<TableHeader>
					<TableRow>
						<TableHead>{t("admin.companies.columns.name")}</TableHead>
						<TableHead>{t("admin.companies.columns.slug")}</TableHead>
						<TableHead>{t("admin.companies.columns.createdAt")}</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{companies.map(company => (
						<CompanyRow company={company} key={company.id} />
					))}
				</TableBody>
			</Table>
		</DataTable>
	);
}
```

- [ ] **Step 2: Rewrite `CompanyRow.tsx`**

Full new contents:
```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
	type GetCompanies200,
	getCompaniesQueryKey,
	useDeleteCompaniesByCompanyId,
	usePatchCompaniesByCompanyId,
} from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";

interface CompanyRowProps {
	company: GetCompanies200[number];
}

export function CompanyRow({ company }: CompanyRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(company.name);
	const [slug, setSlug] = useState(company.slug);
	const [error, setError] = useState<string | null>(null);

	const update = usePatchCompaniesByCompanyId();
	const remove = useDeleteCompaniesByCompanyId();

	function reset() {
		setName(company.name);
		setSlug(company.slug);
		setError(null);
		setEditing(false);
	}

	function save() {
		setError(null);
		update.mutate(
			{ companyId: company.id, data: { name, slug: slug.trim() } },
			{
				onError: caught =>
					setError(
						caught.status === 409 ? t("admin.companies.edit.slugTaken") : t("admin.companies.edit.error"),
					),
				onSuccess: async () => {
					setEditing(false);
					await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
				},
			},
		);
	}

	async function del() {
		if (!(await showConfirm(t("admin.companies.row.deleteConfirm", { name: company.name })))) {
			return;
		}

		remove.mutate(
			{ companyId: company.id },
			{
				onError: () => void showAlert(t("admin.companies.row.deleteError")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() }),
			},
		);
	}

	if (!editing) {
		return (
			<TableRow>
				<TableCell className="font-medium">{company.name}</TableCell>
				<TableCell className="text-muted-foreground">{company.slug}</TableCell>
				<TableCell className="text-muted-foreground">
					{new Date(company.createdAt).toLocaleDateString()}
				</TableCell>
				<TableCell className="text-right">
					<div className="flex justify-end gap-2">
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							{t("admin.companies.edit.action")}
						</Button>
						<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
							{t("admin.companies.row.delete")}
						</Button>
					</div>
				</TableCell>
			</TableRow>
		);
	}

	return (
		<TableRow>
			<TableCell>
				<Input
					className="min-w-0"
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.companies.create.namePlaceholder")}
					value={name}
				/>
			</TableCell>
			<TableCell>
				<Input
					className="min-w-0"
					onChange={event => setSlug(event.currentTarget.value)}
					placeholder={t("admin.companies.edit.slugPlaceholder")}
					value={slug}
				/>
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</TableCell>
			<TableCell className="text-muted-foreground">{new Date(company.createdAt).toLocaleDateString()}</TableCell>
			<TableCell>
				<div className="flex justify-end gap-2 whitespace-nowrap">
					<Button disabled={update.isPending} onClick={reset} size="sm" type="button" variant="outline">
						{t("admin.companies.edit.cancel")}
					</Button>
					<Button disabled={update.isPending || !name || !slug.trim()} onClick={save} size="sm" type="button">
						{update.isPending ? t("admin.companies.edit.saving") : t("admin.companies.edit.save")}
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}
```

- [ ] **Step 3: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS.

- [ ] **Step 4: Manual verification**

```bash
cd frontend && bun run dev
```
Log in as a super admin (this route requires it — see `requireSuperAdminBeforeLoad`), open `/admin/companies`, confirm the fixed column widths still hold, edit/save/cancel/delete all work identically to before. Stop the dev server after.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/admin/companies/components/CompaniesTable.tsx frontend/src/routes/admin/companies/components/CompanyRow.tsx
git -c commit.gpgsign=false commit -m "refactor(frontend): migrate companies admin table to shadcn Table"
```

---

### Task 8: Migrate the `staff` section

**Files:**
- Modify: `frontend/src/routes/admin/staff/components/StaffTable.tsx`
- Modify: `frontend/src/routes/admin/staff/components/StaffRow.tsx`
- Modify: `frontend/src/routes/admin/staff/components/InviteStaffForm.tsx`

- [ ] **Step 1: Rewrite `StaffTable.tsx`**

Full new contents:
```tsx
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GetStaff200 } from "@/lib/api";
import { StaffRow } from "./StaffRow";

interface StaffTableProps {
	staff: GetStaff200;
}

export function StaffTable({ staff }: StaffTableProps) {
	const { t } = useTranslation();

	if (staff.length === 0) {
		return <EmptyState title={t("admin.staff.empty")} />;
	}

	return (
		<DataTable>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("admin.staff.columns.name")}</TableHead>
						<TableHead>{t("admin.staff.columns.email")}</TableHead>
						<TableHead>{t("admin.staff.columns.role")}</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{staff.map(member => (
						<StaffRow key={member.id} member={member} />
					))}
				</TableBody>
			</Table>
		</DataTable>
	);
}
```

- [ ] **Step 2: Rewrite `StaffRow.tsx`**

Full new contents:
```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import {
	type GetStaff200,
	getStaffQueryKey,
	useDeleteStaffByStaffId,
	usePatchStaffByStaffId,
} from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";

type EditableRole = "manager" | "attendant" | "kitchen";

const editableRoles = new Set<string>(["manager", "attendant", "kitchen"]);

interface StaffRowProps {
	member: GetStaff200[number];
}

export function StaffRow({ member }: StaffRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchStaffByStaffId();
	const remove = useDeleteStaffByStaffId();

	const isEditableRole = editableRoles.has(member.role);
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });

	const roleOptions = [
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
	];

	function changeRole(role: string) {
		patch.mutate(
			{ data: { role: role as EditableRole }, staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.updateError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	async function removeMember() {
		if (!(await showConfirm(t("admin.staff.row.removeConfirm", { name: member.name })))) {
			return;
		}
		remove.mutate(
			{ staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.removeError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	return (
		<TableRow>
			<TableCell className="font-medium">{member.name}</TableCell>
			<TableCell className="text-muted-foreground">{member.email}</TableCell>
			<TableCell>
				{isEditableRole ? (
					<Select onValueChange={changeRole} value={member.role}>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{roleOptions.map(option => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<span className="text-muted-foreground">
						{t(`admin.staff.roles.${member.role}`, { defaultValue: member.role })}
					</span>
				)}
			</TableCell>
			<TableCell className="text-right">
				{isEditableRole && (
					<Button
						disabled={remove.isPending}
						onClick={removeMember}
						size="sm"
						type="button"
						variant="outline"
					>
						{t("admin.staff.row.remove")}
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
}
```

- [ ] **Step 3: Rewrite `InviteStaffForm.tsx`**

Full new contents:
```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStaffQueryKey, usePostStaff } from "@/lib/api";

type Role = "manager" | "attendant" | "kitchen" | "courier";

export function InviteStaffForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [role, setRole] = useState<Role>("attendant");
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePostStaff();

	const roleOptions = [
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
		{ label: t("admin.staff.roles.courier"), value: "courier" },
	];

	return (
		<form
			className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { email, name, password, role } },
					{
						onError: caught =>
							setError(
								caught.status === 409 ? t("admin.staff.invite.emailTaken") : t("admin.staff.invite.error"),
							),
						onSuccess: async () => {
							setName("");
							setEmail("");
							setPassword("");
							setRole("attendant");
							await queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });
						},
					},
				);
			}}
		>
			<Label>
				<span>
					{t("admin.staff.invite.name")} <RequiredMark />
				</span>
				<Input
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.staff.invite.namePlaceholder")}
					required
					value={name}
				/>
			</Label>
			<Label>
				<span>
					{t("admin.staff.invite.email")} <RequiredMark />
				</span>
				<Input
					onChange={event => setEmail(event.currentTarget.value)}
					placeholder={t("admin.staff.invite.emailPlaceholder")}
					required
					type="email"
					value={email}
				/>
			</Label>
			<Label>
				<span>
					{t("admin.staff.invite.password")} <RequiredMark />
				</span>
				<div className="relative">
					<Input
						className="pr-11"
						onChange={event => setPassword(event.currentTarget.value)}
						required
						type={showPassword ? "text" : "password"}
						value={password}
					/>
					<button
						aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
						className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onClick={() => setShowPassword(current => !current)}
						title={showPassword ? "Ocultar senha" : "Mostrar senha"}
						type="button"
					>
						{showPassword ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
					</button>
				</div>
			</Label>
			<div className="flex flex-col gap-1.5">
				<span className="font-medium text-sm">{t("admin.staff.invite.role")}</span>
				<Select onValueChange={value => setRole(value as Role)} value={role}>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{roleOptions.map(option => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="sm:col-span-2 lg:col-span-4">
				<Button disabled={isPending || !name || !email || password.length < 6} type="submit">
					{isPending ? t("admin.staff.invite.submitting") : t("admin.staff.invite.submit")}
				</Button>
				{error && <p className="mt-2 text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
```

- [ ] **Step 4: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS.

- [ ] **Step 5: Manual verification**

```bash
cd frontend && bun run dev
```
Open `/admin/staff`. Confirm: invite form's role `Select` opens/closes/selects correctly, submitting creates a staff member; existing rows' role `Select` (for manager/attendant/kitchen) updates on change; the non-editable `courier` role still renders as plain text with no dropdown; remove button still asks for confirmation and works. Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/routes/admin/staff/components/StaffTable.tsx frontend/src/routes/admin/staff/components/StaffRow.tsx frontend/src/routes/admin/staff/components/InviteStaffForm.tsx
git -c commit.gpgsign=false commit -m "refactor(frontend): migrate staff admin table and role select to shadcn"
```

---

### Task 9: Full verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

```bash
turbo run check-types -F frontend
```
Expected: PASS.

- [ ] **Step 2: Build**

```bash
turbo run build -F frontend
```
Expected: PASS.

- [ ] **Step 3: Confirm no leftover references to removed/changed APIs**

```bash
grep -rn "tableClassName" frontend/src
grep -rn "from \"@/components/ui/CustomSelect\"" frontend/src/routes/admin/tags frontend/src/routes/admin/companies frontend/src/routes/admin/staff
```
Expected: both empty. (`CustomSelect` itself stays — it's still used by later phases; these greps only confirm the three migrated sections stopped using it.)

---

## What's next

Phases 2–5 from the design spec (products/units/categories, orders/kitchen, branding/reports/reviews, final sweep deleting `Modal`/`CustomSelect`/`DataTable` if fully unused) are each their own plan doc, written via the same brainstorming → writing-plans flow when picked up.
