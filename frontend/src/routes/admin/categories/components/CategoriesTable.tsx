import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { type GetCategories200, getCategoriesQueryKey, usePutCategoriesOrder } from "@/lib/api";
import { showToast } from "@/stores";
import { CategoryRow } from "./CategoryRow";

interface CategoriesTableProps {
	categories: GetCategories200;
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const reorder = usePutCategoriesOrder();
	if (categories.length === 0) return <EmptyState title={t("admin.categories.empty")} />;

	function move(categoryId: string, direction: -1 | 1) {
		const from = categories.findIndex(category => category.id === categoryId);
		const to = from + direction;
		if (from < 0 || to < 0 || to >= categories.length) return;
		const categoryIds = categories.map(category => category.id);
		[categoryIds[from], categoryIds[to]] = [categoryIds[to], categoryIds[from]];
		reorder.mutate(
			{ data: { categoryIds } },
			{
				onError: () => showToast(t("admin.categories.order.error"), "negative"),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });
					showToast(t("admin.categories.order.success"), "info");
				},
			},
		);
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.position")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.products")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{categories.map((category, index) => (
					<CategoryRow
						category={category}
						isFirst={index === 0}
						isLast={index === categories.length - 1}
						key={category.id}
						onMove={move}
						reordering={reorder.isPending}
					/>
				))}
			</tbody>
		</DataTable>
	);
}
