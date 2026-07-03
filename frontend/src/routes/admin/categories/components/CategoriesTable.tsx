import { useTranslation } from "react-i18next";
import type { GetCategories200 } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryRow } from "./CategoryRow";

interface CategoriesTableProps {
	categories: GetCategories200;
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
	const { t } = useTranslation();

	if (categories.length === 0) {
		return <EmptyState title={t("admin.categories.empty")} />;
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.position")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{categories.map(category => (
					<CategoryRow category={category} key={category.id} />
				))}
			</tbody>
		</DataTable>
	);
}
