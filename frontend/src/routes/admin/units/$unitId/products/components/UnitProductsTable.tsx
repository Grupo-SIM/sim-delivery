import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, Product, UnitProduct } from "./types";
import { UnitProductRow } from "./UnitProductRow";

interface UnitProductsTableProps {
	associations: UnitProduct[];
	categories: Category[];
	products: Product[];
	unitId: string;
}

export function UnitProductsTable({ associations, categories, products, unitId }: UnitProductsTableProps) {
	const { t } = useTranslation();

	if (associations.length === 0) {
		return <EmptyState title={t("admin.unitProducts.empty")} />;
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.unitProducts.columns.product")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.unitProducts.columns.category")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.unitProducts.columns.price")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.unitProducts.columns.availability")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{associations.map(association => (
					<UnitProductRow
						association={association}
						categories={categories}
						key={association.id}
						products={products}
						unitId={unitId}
					/>
				))}
			</tbody>
		</DataTable>
	);
}
