import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetDiscounts200, GetProducts200, GetTags200, GetUnits200 } from "@/lib/api";
import { DiscountRow } from "./DiscountRow";

interface DiscountsTableProps {
	discounts: GetDiscounts200;
	products: GetProducts200 | undefined;
	tags: GetTags200 | undefined;
	units: GetUnits200 | undefined;
}

export function DiscountsTable({ discounts, products, tags, units }: DiscountsTableProps) {
	const { t } = useTranslation();

	if (discounts.length === 0) return <EmptyState title={t("admin.discounts.empty")} />;

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.discounts.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.discounts.columns.kind")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.discounts.columns.value")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.discounts.columns.targets")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.discounts.columns.units")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.discounts.columns.period")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{discounts.map(discount => (
					<DiscountRow discount={discount} key={discount.id} products={products} tags={tags} units={units} />
				))}
			</tbody>
		</DataTable>
	);
}
