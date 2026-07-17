import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuArrowDown, LuArrowUp, LuPencil, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetCategories200,
	getCategoriesQueryKey,
	useDeleteCategoriesByCategoryId,
	usePatchCategoriesByCategoryId,
} from "@/lib/api";
import { showAlert, showConfirm, showToast } from "@/stores";

interface CategoryRowProps {
	category: GetCategories200[number];
	isFirst: boolean;
	isLast: boolean;
	onMove: (categoryId: string, direction: -1 | 1) => void;
	reordering: boolean;
}

export function CategoryRow({ category, isFirst, isLast, onMove, reordering }: CategoryRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(category.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const { isPending, mutate } = usePatchCategoriesByCategoryId();
	const remove = useDeleteCategoriesByCategoryId();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });

	function cancel() {
		setName(category.name);
		setEditing(false);
	}

	function save() {
		flushName();
		mutate(
			{ categoryId: category.id, data: { name: localName } },
			{
				onError: () => showToast(t("admin.categories.edit.error"), "negative"),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
				},
			},
		);
	}

	async function del() {
		if (!(await showConfirm(t("admin.categories.row.deleteConfirm", { name: category.name })))) return;
		remove.mutate(
			{ categoryId: category.id },
			{
				onError: () => void showAlert(t("admin.categories.row.deleteError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="w-56 px-4 py-3 font-medium">
				{editing ? (
					<div className="grid">
						<span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">
							{category.name || " "}
						</span>
						<Input
							className="col-start-1 row-start-1 h-auto min-w-32 rounded-none border-0 bg-transparent p-0 font-medium leading-[inherit] shadow-none focus-visible:ring-0"
							onBlur={flushName}
							onChange={event => setLocalName(event.currentTarget.value)}
							placeholder={t("admin.categories.create.namePlaceholder")}
							value={localName}
						/>
					</div>
				) : (
					category.name
				)}
			</td>
			<td className="w-40 px-4 py-3 text-muted-foreground">
				<div className="flex items-center gap-2">
					<span className="w-6 text-center tabular-nums">{category.position}</span>
					<Tooltip content={t("admin.categories.order.up")}>
						<Button
							aria-label={t("admin.categories.order.up")}
							disabled={isFirst || reordering}
							onClick={() => onMove(category.id, -1)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<LuArrowUp className="size-4" />
						</Button>
					</Tooltip>
					<Tooltip content={t("admin.categories.order.down")}>
						<Button
							aria-label={t("admin.categories.order.down")}
							disabled={isLast || reordering}
							onClick={() => onMove(category.id, 1)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<LuArrowDown className="size-4" />
						</Button>
					</Tooltip>
				</div>
			</td>
			<td className="px-4 py-3">
				<div className="flex max-w-80 flex-wrap gap-1.5">
					{category.products.length === 0 ? (
						<span className="text-muted-foreground text-sm">{t("admin.categories.products.empty")}</span>
					) : (
						category.products.map(product => (
							<Badge key={product.id} tone="neutral">
								{product.title}
							</Badge>
						))
					)}
				</div>
			</td>
			<td className="w-56 px-4 py-3 text-right">
				<div className="flex justify-end gap-2">
					{editing ? (
						<>
							<Button disabled={isPending} onClick={cancel} size="sm" type="button" variant="outline">
								{t("admin.categories.edit.cancel")}
							</Button>
							<Button disabled={isPending || !localName.trim()} onClick={save} size="sm" type="button">
								{isPending ? t("admin.categories.edit.saving") : t("admin.categories.edit.save")}
							</Button>
						</>
					) : (
						<>
							<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
								<LuPencil className="size-4" />
								{t("admin.categories.edit.action")}
							</Button>
							<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
								<LuTrash2 className="size-4" />
								{t("admin.categories.row.delete")}
							</Button>
						</>
					)}
				</div>
			</td>
		</tr>
	);
}
