import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";

interface UnitRow {
	averageOrderValue: number;
	cancelRatePercent: number;
	grossMarginPercent: number | null;
	netRevenueCents: number;
	orderCount: number;
	unitId: string;
	unitName: string;
}

interface UnitComparisonTableProps {
	formatCents: (value: number) => string;
	isPending: boolean;
	rows: UnitRow[];
}

export function UnitComparisonTable({ formatCents, isPending, rows }: UnitComparisonTableProps) {
	const { t } = useTranslation();
	const noKnownCost = t("admin.reports.summary.noKnownCost");

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{t("admin.reports.finance.units.title")}</h2>
			<DataTable>
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="p-3">{t("admin.reports.finance.units.columns.unit")}</th>
						<th className="p-3 text-right">{t("admin.reports.finance.units.columns.orders")}</th>
						<th className="p-3 text-right">{t("admin.reports.finance.units.columns.revenue")}</th>
						<th className="p-3 text-right">{t("admin.reports.finance.units.columns.averageOrderValue")}</th>
						<th className="p-3 text-right">{t("admin.reports.finance.units.columns.grossMargin")}</th>
						<th className="p-3 text-right">{t("admin.reports.finance.units.columns.cancelRate")}</th>
					</tr>
				</thead>
				<tbody>
					{isPending ? (
						<tr>
							<td className="p-3" colSpan={6}>
								<Skeleton className="h-4 w-full" />
							</td>
						</tr>
					) : rows.length === 0 ? (
						<tr>
							<td className="p-8 text-center text-muted-foreground" colSpan={6}>
								{t("admin.reports.empty")}
							</td>
						</tr>
					) : (
						rows.map(row => (
							<tr className="border-border/60 border-b last:border-0" key={row.unitId}>
								<td className="p-3 font-medium">{row.unitName}</td>
								<td className="p-3 text-right">{row.orderCount}</td>
								<td className="p-3 text-right">{formatCents(row.netRevenueCents)}</td>
								<td className="p-3 text-right">{formatCents(row.averageOrderValue)}</td>
								<td className="p-3 text-right">
									{row.grossMarginPercent == null ? noKnownCost : `${row.grossMarginPercent.toFixed(1)}%`}
								</td>
								<td className="p-3 text-right">{row.cancelRatePercent.toFixed(1)}%</td>
							</tr>
						))
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
