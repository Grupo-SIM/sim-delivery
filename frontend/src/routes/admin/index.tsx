import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import type { GetReportsDashboardAnalytics200GroupByEnumKey } from "@/lib/api";
import {
	exportReports,
	useGetOrders,
	useGetReportsBestSellers,
	useGetReportsDashboardAnalytics,
	useGetReportsSummary,
} from "@/lib/api";
import { isAttendant } from "@/lib/staff-guard";
import { showToast } from "@/stores";
import { useAuthStore } from "@/stores/auth";
import {
	DashboardDateRangePicker,
	DashboardDeliveryRadiusTable,
	DashboardOrdersByPeriodChart,
	type DashboardPeriodSelection,
	DashboardUnitPicker,
} from "./components";

function formatCents(cents: number): string {
	return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function AdminDashboardPage() {
	const { t } = useTranslation();
	const role = useAuthStore(state => state.role);
	const attendant = isAttendant(role);
	const [period, setPeriod] = useState<DashboardPeriodSelection>("month");
	const [groupBy, setGroupBy] = useState<GetReportsDashboardAnalytics200GroupByEnumKey | "auto">("auto");
	const [dateRange, setDateRange] = useState<{ endDate: string; startDate: string } | null>(null);
	const [unitId, setUnitId] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	const periodLabels: Record<DashboardPeriodSelection, string> = {
		custom: t("admin.reports.period.custom"),
		lastMonth: t("admin.reports.period.lastMonth"),
		month: t("admin.reports.period.month"),
		quarter: t("admin.reports.period.quarter"),
		semester: t("admin.reports.period.semester"),
		today: t("admin.reports.period.today"),
		week: t("admin.reports.period.week"),
		year: t("admin.reports.period.year"),
		yesterday: t("admin.reports.period.yesterday"),
	};

	const groupByOptions = [
		{ label: t("admin.reports.groupBy.hourOfDay"), value: "hourOfDay" },
		{ label: t("admin.reports.groupBy.dayOfWeek"), value: "dayOfWeek" },
		{ label: t("admin.reports.groupBy.dayOfMonth"), value: "dayOfMonth" },
		{ label: t("admin.reports.groupBy.month"), value: "month" },
		{ label: t("admin.reports.groupBy.quarter"), value: "quarter" },
		{ label: t("admin.reports.groupBy.year"), value: "year" },
	] as const;

	const queryPeriod = period === "custom" ? undefined : period;

	const {
		data: summary,
		isError: summaryError,
		isPending: summaryPending,
	} = useGetReportsSummary({ ...dateRange, ...(unitId ? { unitId } : {}), period: queryPeriod });
	const {
		data: bestSellers,
		isError: bsError,
		isPending: bsPending,
	} = useGetReportsBestSellers({ ...dateRange, ...(unitId ? { unitId } : {}), period: queryPeriod });
	const {
		data: analytics,
		isError: analyticsError,
		isPending: analyticsPending,
	} = useGetReportsDashboardAnalytics({
		...dateRange,
		...(groupBy === "auto" ? {} : { groupBy }),
		...(unitId ? { unitId } : {}),
		period: queryPeriod,
	});
	const {
		data: allOrders,
		isError: ordersError,
		isPending: ordersPending,
	} = useGetOrders(
		dateRange || unitId
			? {
					...(dateRange
						? { from: `${dateRange.startDate}T00:00:00`, to: `${dateRange.endDate}T23:59:59.999` }
						: {}),
					...(unitId ? { unitId } : {}),
				}
			: undefined,
	);

	const recentOrders = allOrders?.slice(0, 10) ?? [];

	// The spreadsheet must match what's on screen, so it takes the same period params as the hooks above.
	const handleExport = async () => {
		setIsExporting(true);

		try {
			await exportReports({ ...dateRange, ...(unitId ? { unitId } : {}), period: queryPeriod });
			showToast(t("admin.reports.export.success"), "positive");
		} catch {
			showToast(t("admin.reports.export.error"), "negative");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Container className="space-y-8 py-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<SectionHeading subtitle={t("admin.dashboard.subtitle")} title={t("admin.dashboard.title")} />
				<div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
					<span className="font-medium text-sm">{t("admin.reports.period.title")}</span>
					<DashboardDateRangePicker
						onChange={range => {
							setDateRange(range);
							setPeriod("custom");
							setGroupBy("auto");
						}}
						onPresetChange={nextPeriod => {
							setDateRange(null);
							setPeriod(nextPeriod as DashboardPeriodSelection);
							setGroupBy("auto");
						}}
						placeholder={t("admin.reports.period.customPlaceholder")}
						presetOptions={Object.entries(periodLabels).map(([value, label]) => ({ label, value }))}
						presetValue={period}
						value={dateRange}
					/>
					<DashboardUnitPicker onChange={setUnitId} value={unitId} />
					{!attendant && (
						<Button disabled={isExporting} onClick={handleExport} type="button" variant="outline">
							{isExporting ? t("admin.reports.export.pending") : t("admin.reports.export.button")}
						</Button>
					)}
				</div>
			</div>

			{/* Stats */}
			{summaryPending ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
			) : summaryError ? (
				<ErrorState title={t("admin.reports.loadError")} />
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard
						label={t("admin.reports.summary.totalRevenue")}
						value={formatCents(Number(summary.totalRevenue))}
					/>
					<StatCard label={t("admin.reports.summary.orderCount")} value={Number(summary.orderCount)} />
					<StatCard
						label={t("admin.reports.summary.averageOrderValue")}
						value={formatCents(Number(summary.averageOrderValue))}
					/>
					<StatCard
						label={t("admin.reports.summary.grossMargin")}
						value={
							summary.grossMarginPercent == null
								? t("admin.reports.summary.noKnownCost")
								: `${Number(summary.grossMarginPercent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
						}
					/>
				</div>
			)}

			{analyticsPending ? (
				<Skeleton className="h-72" />
			) : analyticsError ? (
				<ErrorState title={t("admin.reports.loadError")} />
			) : (
				<DashboardOrdersByPeriodChart
					groupBy={analytics.groupBy}
					onGroupByChange={setGroupBy}
					options={groupByOptions}
					ordersByPeriod={analytics.ordersByPeriod}
					selectLabel={t("admin.reports.groupBy.title")}
					title={t("admin.reports.ordersByPeriod.title")}
				/>
			)}

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div className="min-w-0">
					{analyticsPending ? (
						<Skeleton className="h-72" />
					) : analyticsError ? (
						<ErrorState title={t("admin.reports.loadError")} />
					) : (
						<DashboardDeliveryRadiusTable
							columns={{
								deliveryFee: t("admin.reports.deliveryRadius.columns.deliveryFee"),
								orderCount: t("admin.reports.deliveryRadius.columns.orderCount"),
								radius: t("admin.reports.deliveryRadius.columns.radius"),
								revenue: t("admin.reports.deliveryRadius.columns.revenue"),
								unit: t("admin.reports.deliveryRadius.columns.unit"),
							}}
							empty={t("admin.reports.deliveryRadius.empty")}
							formatCents={formatCents}
							noRadius={t("admin.reports.deliveryRadius.noRadius")}
							rows={analytics.deliveryRadiusPerformance}
							title={t("admin.reports.deliveryRadius.title")}
						/>
					)}
				</div>

				{/* Best sellers */}
				<div className="min-w-0">
					<h2 className="mb-3 font-semibold text-base">{t("admin.reports.bestSellers.title")}</h2>
					{bsPending ? (
						<Skeleton className="h-40 w-full" />
					) : bsError ? (
						<ErrorState title={t("admin.reports.loadError")} />
					) : (
						<DataTable tableClassName="!min-w-0 table-fixed">
							<colgroup>
								<col className="w-[40%]" />
								<col className="w-[18%]" />
								<col className="w-[22%]" />
								<col className="w-[20%]" />
							</colgroup>
							<thead>
								<tr className="border-border border-b text-left text-muted-foreground">
									<th className="py-3 pr-2 pl-4 font-medium">
										{t("admin.reports.bestSellers.columns.product")}
									</th>
									<th className="px-2 py-3 text-right font-medium">
										{t("admin.reports.bestSellers.columns.quantity")}
									</th>
									<th className="py-3 pr-4 pl-2 text-right font-medium">
										{t("admin.reports.bestSellers.columns.revenue")}
									</th>
									<th className="py-3 pr-4 pl-2 text-right font-medium">
										{t("admin.reports.bestSellers.columns.grossMargin")}
									</th>
								</tr>
							</thead>
							<tbody>
								{bestSellers.length === 0 && (
									<tr>
										<td className="px-6 py-20 text-center font-semibold text-sm" colSpan={4}>
											{t("admin.reports.empty")}
										</td>
									</tr>
								)}
								{bestSellers.map(item => (
									<tr className="border-border/60 border-b last:border-0" key={item.productId}>
										<td className="py-3 pr-2 pl-4 font-medium">{item.productName}</td>
										<td className="px-2 py-3 text-right text-sm">{Number(item.totalQuantity)}</td>
										<td className="py-3 pr-4 pl-2 text-right text-sm">
											{formatCents(Number(item.totalRevenue))}
										</td>
										<td className="py-3 pr-4 pl-2 text-right text-sm">
											{item.grossMarginPercent == null
												? t("admin.reports.summary.noKnownCost")
												: `${Number(item.grossMarginPercent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
										</td>
									</tr>
								))}
							</tbody>
						</DataTable>
					)}
				</div>
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
