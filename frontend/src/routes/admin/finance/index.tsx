import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import {
	exportReports,
	type GetReportsFinancialQueryParamsGroupByEnumKey,
	useGetReportsBusiness,
	useGetReportsFinancial,
} from "@/lib/api";
import {
	DashboardDateRangePicker,
	type DashboardPeriodSelection,
	DashboardUnitPicker,
} from "@/routes/admin/components";
import {
	CancellationByStage,
	CancellationSummary,
	CustomerMetrics,
	DiscountMetrics,
	FinancialDistribution,
	FinancialTrend,
	OperationsMetrics,
	UnitComparisonTable,
} from "./components";

const formatCents = (cents: number) =>
	(cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
function FinancePage() {
	const { t } = useTranslation();
	const [period, setPeriod] = useState<DashboardPeriodSelection>("month");
	const [dateRange, setDateRange] = useState<{ endDate: string; startDate: string } | null>(null);
	const [unitId, setUnitId] = useState("");
	const queryPeriod = period === "custom" ? undefined : period;
	const groupBy: GetReportsFinancialQueryParamsGroupByEnumKey =
		queryPeriod === "today" || queryPeriod === "yesterday"
			? "hourOfDay"
			: queryPeriod === "week"
				? "dayOfWeek"
				: queryPeriod === "month" || queryPeriod === "lastMonth" || !queryPeriod
					? "dayOfMonth"
					: queryPeriod === "quarter" || queryPeriod === "semester"
						? "month"
						: "quarter";
	const {
		data: report,
		isError,
		isPending,
	} = useGetReportsFinancial({
		...dateRange,
		groupBy,
		...(unitId ? { unitId } : {}),
		period: queryPeriod,
	});
	const { data: business, isPending: businessPending } = useGetReportsBusiness({
		...dateRange,
		...(unitId ? { unitId } : {}),
		period: queryPeriod,
	});
	const labels: Record<DashboardPeriodSelection, string> = {
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
	const translatePaymentMethod = (method: string) =>
		t(`admin.reports.finance.paymentMethod.${method}`, { defaultValue: method });
	const translateDeliveryMethod = (method: string) =>
		t(`admin.reports.finance.deliveryMethod.${method}`, { defaultValue: method });

	if (isError || (!isPending && !report))
		return (
			<Container className="py-8">
				<ErrorState title={t("admin.reports.loadError")} />
			</Container>
		);

	const loadingValue = <Skeleton className="h-6 w-36" />;
	const loadingHint = <Skeleton className="h-[11px] w-32" />;
	const cards = report
		? [
				{
					change: report.comparison.netRevenuePercent,
					label: "Receita líquida",
					value: formatCents(Number(report.summary.netRevenueCents)),
				},
				{
					change: report.comparison.grossProfitPercent,
					label: "Lucro bruto parcial",
					value: formatCents(Number(report.summary.grossProfitCents)),
				},
				{
					change: report.comparison.grossMarginPercent,
					label: "Margem bruta parcial",
					value:
						report.summary.grossMarginPercent === null
							? "—"
							: `${Number(report.summary.grossMarginPercent).toFixed(1)}%`,
				},
				{
					change: report.comparison.orderCountPercent,
					label: "Pedidos concluídos",
					value: Number(report.summary.orderCount),
				},
				{
					change: report.comparison.averageOrderValuePercent,
					label: "Ticket médio",
					value: formatCents(Number(report.summary.averageOrderValue)),
				},
				{ change: null, label: "Frete", value: formatCents(Number(report.summary.deliveryFeeCents)) },
			]
		: [
				{ change: loadingHint, label: "Receita líquida", value: loadingValue },
				{ change: loadingHint, label: "Lucro bruto parcial", value: loadingValue },
				{ change: loadingHint, label: "Margem bruta parcial", value: loadingValue },
				{ change: loadingHint, label: "Pedidos concluídos", value: loadingValue },
				{ change: loadingHint, label: "Ticket médio", value: loadingValue },
				{ change: null, label: "Frete", value: loadingValue },
			];
	const trend = report?.trend.map(row => ({ ...row, netRevenueCents: Number(row.netRevenueCents) })) ?? [];
	const payment =
		report?.distribution.payment.map(row => ({
			...row,
			netRevenueCents: Number(row.netRevenueCents),
			orderCount: Number(row.orderCount),
		})) ?? [];
	const delivery =
		report?.distribution.delivery.map(row => ({
			...row,
			netRevenueCents: Number(row.netRevenueCents),
			orderCount: Number(row.orderCount),
		})) ?? [];

	return (
		<Container className="space-y-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<SectionHeading
					subtitle="Resultado consolidado por competência financeira."
					title="Relatório financeiro"
				/>
				<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
					<DashboardDateRangePicker
						onChange={range => {
							setDateRange(range);
							setPeriod("custom");
						}}
						onPresetChange={nextPeriod => {
							setDateRange(null);
							setPeriod(nextPeriod as DashboardPeriodSelection);
						}}
						placeholder={t("admin.reports.period.customPlaceholder")}
						presetOptions={Object.entries(labels).map(([value, label]) => ({ label, value }))}
						presetValue={period}
						value={dateRange}
					/>
					<DashboardUnitPicker onChange={setUnitId} value={unitId} />
					<Link className={buttonClassName({ variant: "outline" })} to="/admin/finance/products">
						{t("admin.reports.finance.products.link")}
					</Link>
					<Button
						onClick={() =>
							void exportReports({ ...dateRange, ...(unitId ? { unitId } : {}), period: queryPeriod })
						}
						variant="outline"
					>
						{t("admin.reports.export.button")}
					</Button>
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{cards.map(card => (
					<StatCard
						hint={
							typeof card.change === "number"
								? `${card.change >= 0 ? "+" : ""}${card.change.toFixed(1)}% vs. período anterior`
								: card.change
						}
						key={card.label}
						label={card.label}
						value={card.value}
					/>
				))}
			</div>
			<FinancialTrend
				formatCents={formatCents}
				isPending={isPending}
				rows={trend}
				title="Tendência financeira"
			/>
			<div className="grid gap-6 lg:grid-cols-2">
				<FinancialDistribution
					empty="Sem dados no período."
					formatCents={formatCents}
					isPending={isPending}
					rows={payment}
					title="Receita por forma de pagamento"
					translateMethod={translatePaymentMethod}
					unreported="Não informado"
				/>
				<FinancialDistribution
					empty="Sem dados no período."
					formatCents={formatCents}
					isPending={isPending}
					rows={delivery}
					title="Receita por modalidade de entrega"
					translateMethod={translateDeliveryMethod}
					unreported="Não informado"
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					label="Faturamento bruto"
					value={report ? formatCents(Number(report.summary.grossRevenueCents)) : loadingValue}
				/>
				<StatCard
					label="Descontos e cashback"
					value={
						report
							? formatCents(
									Number(report.summary.discountCents) + Number(report.summary.cashbackRedeemedCents),
								)
							: loadingValue
					}
				/>
				<StatCard
					hint={report ? "Lucro considera somente itens com custo conhecido." : loadingHint}
					label="Receita sem custo conhecido"
					value={report ? formatCents(Number(report.summary.unknownCostRevenueCents)) : loadingValue}
				/>
			</div>
			<CancellationSummary
				cancellation={
					report && {
						...report.cancellation,
						averageCanceledTicket: Number(report.cancellation.averageCanceledTicket),
						canceledOrderCount: Number(report.cancellation.canceledOrderCount),
						lostRevenueCents: Number(report.cancellation.lostRevenueCents),
						pendingRefundCents: Number(report.cancellation.pendingRefundCents),
						refundedCents: Number(report.cancellation.refundedCents),
						wastedCostCents: Number(report.cancellation.wastedCostCents),
					}
				}
				cancelRatePercentPoints={report?.comparison.cancelRatePercentPoints ?? null}
				formatCents={formatCents}
				isPending={isPending}
			/>
			<CancellationByStage
				formatCents={formatCents}
				isPending={isPending}
				rows={
					report?.cancellation.byStage.map(row => ({
						...row,
						lostRevenueCents: Number(row.lostRevenueCents),
						orderCount: Number(row.orderCount),
					})) ?? []
				}
			/>
			<CustomerMetrics
				customers={
					business && {
						...business.customers,
						newCustomers: Number(business.customers.newCustomers),
						returningCustomers: Number(business.customers.returningCustomers),
						revenuePerCustomer: Number(business.customers.revenuePerCustomer),
					}
				}
				formatCents={formatCents}
				isPending={businessPending}
			/>
			<DiscountMetrics
				discounts={
					business && {
						...business.discounts,
						cashbackRedeemedCents: Number(business.discounts.cashbackRedeemedCents),
						couponOrderCount: Number(business.discounts.couponOrderCount),
						discountCents: Number(business.discounts.discountCents),
						loyaltyPointsRedeemed: Number(business.discounts.loyaltyPointsRedeemed),
						topCoupons: business.discounts.topCoupons.map(coupon => ({
							...coupon,
							discountCents: Number(coupon.discountCents),
							orderCount: Number(coupon.orderCount),
							revenueCents: Number(coupon.revenueCents),
						})),
					}
				}
				formatCents={formatCents}
				isPending={businessPending}
			/>
			<OperationsMetrics
				isPending={businessPending}
				operations={
					business && {
						...business.operations,
						peaks: {
							byDayOfWeek: business.operations.peaks.byDayOfWeek.map(row => ({
								...row,
								orderCount: Number(row.orderCount),
							})),
							byHourOfDay: business.operations.peaks.byHourOfDay.map(row => ({
								...row,
								orderCount: Number(row.orderCount),
							})),
						},
					}
				}
			/>
			<UnitComparisonTable
				formatCents={formatCents}
				isPending={businessPending}
				rows={
					business?.units.map(row => ({
						...row,
						averageOrderValue: Number(row.averageOrderValue),
						cancelRatePercent: Number(row.cancelRatePercent),
						grossMarginPercent: row.grossMarginPercent === null ? null : Number(row.grossMarginPercent),
						netRevenueCents: Number(row.netRevenueCents),
						orderCount: Number(row.orderCount),
					})) ?? []
				}
			/>
		</Container>
	);
}

export const Route = createFileRoute("/admin/finance/")({ component: FinancePage });
