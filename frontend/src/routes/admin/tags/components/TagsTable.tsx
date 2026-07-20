import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
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
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.tags.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.tags.columns.color")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.tags.columns.products")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{tags.map(tag => (
					<TagRow key={tag.id} tag={tag} />
				))}
			</tbody>
		</DataTable>
	);
}
