import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetReportsBestSellers, useGetReportsSummary } from "@/lib/api";
import type { GetReportsSummaryQueryParamsPeriodEnumKey } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";

function formatCents(cents: number): string {
	return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function ReportsPage() {
	const { t } = useTranslation();
	const [period, setPeriod] = useState<GetReportsSummaryQueryParamsPeriodEnumKey>("month");

	const periodOptions = [
		{ label: t("admin.reports.period.today"), value: "today" },
		{ label: t("admin.reports.period.week"), value: "week" },
		{ label: t("admin.reports.period.month"), value: "month" },
	];

	const { data: summary, isError: summaryError, isPending: summaryPending } = useGetReportsSummary({ period });
	const { data: bestSellers, isError: bsError, isPending: bsPending } = useGetReportsBestSellers({ period });

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.reports.subtitle")} title={t("admin.reports.title")} />

			<div className="flex items-center gap-3">
				<span className="text-sm font-medium">{t("admin.reports.period.title")}</span>
				<div className="w-40">
					<CustomSelect
						onChange={v => setPeriod(v as GetReportsSummaryQueryParamsPeriodEnumKey)}
						options={periodOptions}
						value={period}
					/>
				</div>
			</div>

			{summaryPending ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
			) : summaryError ? (
				<ErrorState title={t("admin.reports.loadError")} />
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<StatCard
						label={t("admin.reports.summary.totalRevenue")}
						value={formatCents(Number(summary.totalRevenue))}
					/>
					<StatCard
						label={t("admin.reports.summary.orderCount")}
						value={Number(summary.orderCount)}
					/>
					<StatCard
						label={t("admin.reports.summary.averageOrderValue")}
						value={formatCents(Number(summary.averageOrderValue))}
					/>
				</div>
			)}

			<div>
				<h2 className="mb-3 font-semibold text-base">{t("admin.reports.bestSellers.title")}</h2>
				{bsPending ? (
					<Skeleton className="h-40 w-full" />
				) : bsError ? (
					<ErrorState title={t("admin.reports.loadError")} />
				) : bestSellers.length === 0 ? (
					<EmptyState title={t("admin.reports.empty")} />
				) : (
					<DataTable>
						<thead>
							<tr className="border-border border-b text-left text-muted-foreground">
								<th className="px-4 py-3 font-medium">{t("admin.reports.bestSellers.columns.product")}</th>
								<th className="px-4 py-3 font-medium text-right">{t("admin.reports.bestSellers.columns.quantity")}</th>
								<th className="px-4 py-3 font-medium text-right">{t("admin.reports.bestSellers.columns.revenue")}</th>
							</tr>
						</thead>
						<tbody>
							{bestSellers.map(item => (
								<tr className="border-border/60 border-b last:border-0" key={item.productId}>
									<td className="px-4 py-3 font-medium">{item.productName}</td>
									<td className="px-4 py-3 text-right text-sm">{Number(item.totalQuantity)}</td>
									<td className="px-4 py-3 text-right text-sm">{formatCents(Number(item.totalRevenue))}</td>
								</tr>
							))}
						</tbody>
					</DataTable>
				)}
			</div>
		</Container>
	);
}

export const Route = createFileRoute("/admin/reports/")({
	beforeLoad: requireStaffBeforeLoad,
	component: ReportsPage,
});
