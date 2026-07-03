import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	getCategoriesQueryKey,
	type GetCategories200,
	useDeleteCategoriesByCategoryId,
	usePatchCategoriesByCategoryId,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showAlert, showConfirm } from "@/stores";

interface CategoryRowProps {
	category: GetCategories200[number];
}

export function CategoryRow({ category }: CategoryRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(category.name);
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePatchCategoriesByCategoryId();
	const remove = useDeleteCategoriesByCategoryId();

	const invalidate = () => queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });

	function save() {
		setError(null);
		mutate(
			{ categoryId: category.id, data: { name } },
			{
				onError: () => setError(t("admin.categories.edit.error")),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
				},
			},
		);
	}

	async function del() {
		if (!(await showConfirm(t("admin.categories.row.deleteConfirm", { name: category.name })))) {
			return;
		}
		remove.mutate(
			{ categoryId: category.id },
			{
				onError: () => void showAlert(t("admin.categories.row.deleteError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	if (!editing) {
		return (
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">{category.name}</td>
				<td className="px-4 py-3 text-muted-foreground">{category.position}</td>
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							{t("admin.categories.edit.action")}
						</Button>
						<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
							{t("admin.categories.row.delete")}
						</Button>
					</div>
				</td>
			</tr>
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3" colSpan={2}>
				<Input onChange={event => setName(event.currentTarget.value)} value={name} />
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</td>
			<td className="px-4 py-3">
				<div className="flex justify-end gap-2">
					<Button
						disabled={isPending}
						onClick={() => {
							setName(category.name);
							setError(null);
							setEditing(false);
						}}
						size="sm"
						type="button"
						variant="outline"
					>
						{t("admin.categories.edit.cancel")}
					</Button>
					<Button disabled={isPending || !name} onClick={save} size="sm" type="button">
						{isPending ? t("admin.categories.edit.saving") : t("admin.categories.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
