import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import type { GetReportsSummaryQueryParamsPeriodEnumKey } from "@/lib/api";
import { useGetOrders, useGetReportsBestSellers, useGetReportsSummary } from "@/lib/api";

function formatCents(cents: number): string {
	return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function AdminDashboardPage() {
	const { t } = useTranslation();
	const [period, setPeriod] = useState<GetReportsSummaryQueryParamsPeriodEnumKey>("month");

	const periodOptions = [
		{ label: t("admin.reports.period.today"), value: "today" },
		{ label: t("admin.reports.period.week"), value: "week" },
		{ label: t("admin.reports.period.month"), value: "month" },
	];

	const {
		data: summary,
		isError: summaryError,
		isPending: summaryPending,
	} = useGetReportsSummary({ period });
	const { data: bestSellers, isError: bsError, isPending: bsPending } = useGetReportsBestSellers({ period });
	const { data: allOrders, isError: ordersError, isPending: ordersPending } = useGetOrders();

	const recentOrders = allOrders?.slice(0, 10) ?? [];

	return (
		<Container className="space-y-8 py-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<SectionHeading subtitle={t("admin.dashboard.subtitle")} title={t("admin.dashboard.title")} />
				<div className="flex items-center gap-3">
					<span className="font-medium text-sm">{t("admin.reports.period.title")}</span>
					<div className="w-40">
						<CustomSelect
							onChange={v => setPeriod(v as GetReportsSummaryQueryParamsPeriodEnumKey)}
							options={periodOptions}
							value={period}
						/>
					</div>
				</div>
			</div>

			{/* Stats */}
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
					<StatCard label={t("admin.reports.summary.orderCount")} value={Number(summary.orderCount)} />
					<StatCard
						label={t("admin.reports.summary.averageOrderValue")}
						value={formatCents(Number(summary.averageOrderValue))}
					/>
				</div>
			)}

			{/* Best sellers */}
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
								<th className="px-4 py-3 text-right font-medium">
									{t("admin.reports.bestSellers.columns.quantity")}
								</th>
								<th className="px-4 py-3 text-right font-medium">
									{t("admin.reports.bestSellers.columns.revenue")}
								</th>
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

			{/* Recent orders */}
			<div>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-semibold text-base">{t("admin.dashboard.recentOrders")}</h2>
					<Link className="text-primary text-sm hover:underline" to="/admin/orders">
						{t("admin.dashboard.viewAll")} →
					</Link>
				</div>
				{ordersPending ? (
					<Skeleton className="h-40 w-full" />
				) : ordersError ? (
					<ErrorState title={t("admin.orders.loadError")} />
				) : recentOrders.length === 0 ? (
					<EmptyState title={t("admin.orders.empty")} />
				) : (
					<DataTable>
						<thead>
							<tr className="border-border border-b text-left text-muted-foreground">
								<th className="px-4 py-3 font-medium">{t("admin.orders.columns.date")}</th>
								<th className="px-4 py-3 font-medium">{t("admin.orders.columns.customer")}</th>
								<th className="px-4 py-3 font-medium">{t("admin.orders.columns.unit")}</th>
								<th className="px-4 py-3 font-medium">{t("admin.orders.columns.status")}</th>
								<th className="px-4 py-3 text-right font-medium">{t("admin.orders.columns.total")}</th>
							</tr>
						</thead>
						<tbody>
							{recentOrders.map(order => (
								<tr className="border-border/60 border-b last:border-0" key={order.id}>
									<td className="px-4 py-3 text-muted-foreground text-sm">
										{new Date(order.createdAt).toLocaleString("pt-BR", {
											day: "2-digit",
											hour: "2-digit",
											minute: "2-digit",
											month: "2-digit",
										})}
									</td>
									<td className="px-4 py-3 font-medium text-sm">{order.customerName}</td>
									<td className="px-4 py-3 text-muted-foreground text-sm">{order.unitName}</td>
									<td className="px-4 py-3 text-sm">
										<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-xs">
											{t(`admin.orders.status.${order.status}`, { defaultValue: order.status })}
										</span>
									</td>
									<td className="px-4 py-3 text-right font-medium text-sm">
										{(Number(order.total) / 100).toLocaleString("pt-BR", {
											currency: "BRL",
											style: "currency",
										})}
									</td>
								</tr>
							))}
						</tbody>
					</DataTable>
				)}
			</div>
		</Container>
	);
}

export const Route = createFileRoute("/admin/")({
	component: AdminDashboardPage,
});
