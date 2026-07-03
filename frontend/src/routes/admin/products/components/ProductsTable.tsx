import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetProducts200 } from "@/lib/api";
import { ProductRow } from "./ProductRow";

interface ProductsTableProps {
	products: GetProducts200;
}

export function ProductsTable({ products }: ProductsTableProps) {
	const { t } = useTranslation();

	if (products.length === 0) {
		return <EmptyState title={t("admin.products.empty")} />;
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.products.columns.product")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.products.columns.price")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.products.columns.cashback")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{products.map(product => (
					<ProductRow key={product.id} product={product} />
				))}
			</tbody>
		</DataTable>
	);
}
