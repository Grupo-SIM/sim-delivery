import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import {
	exportReports,
	type GetReportsFinancialQueryParamsGroupByEnumKey,
	type GetReportsFinancialQueryParamsPeriodEnumKey,
	useGetReportsFinancial,
} from "@/lib/api";
import { type DashboardPeriod, DashboardPeriodPicker } from "@/routes/admin/components";
import { FinancialDistribution, FinancialTrend } from "./components";

const formatCents = (cents: number) =>
	(cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
const periods: DashboardPeriod[] = [
	"today",
	"yesterday",
	"week",
	"month",
	"lastMonth",
	"quarter",
	"semester",
	"year",
];

function FinancePage() {
	const { t } = useTranslation();
	const [period, setPeriod] = useState<GetReportsFinancialQueryParamsPeriodEnumKey>("month");
	const groupBy: GetReportsFinancialQueryParamsGroupByEnumKey = period === "today" || period === "yesterday" ? "hourOfDay" : period === "week" ? "dayOfWeek" : period === "month" || period === "lastMonth" ? "dayOfMonth" : period === "quarter" || period === "semester" ? "month" : "quarter";
	const { data: report, isError, isPending } = useGetReportsFinancial({ groupBy, period });
	const labels = Object.fromEntries([
		["custom", t("admin.reports.period.custom")],
		...periods.map(value => [value, t(`admin.reports.period.${value}`)]),
	]) as Record<DashboardPeriod | "custom", string>;
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
				<div className="flex items-center gap-2">
					<DashboardPeriodPicker labels={labels} onChange={setPeriod} period={period} />
					<Button onClick={() => void exportReports({ period })} variant="outline">
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
			<FinancialTrend formatCents={formatCents} isPending={isPending} rows={trend} title="Tendência financeira" />
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
				<StatCard label="Faturamento bruto" value={report ? formatCents(Number(report.summary.grossRevenueCents)) : loadingValue} />
				<StatCard
					label="Descontos e cashback"
					value={
						report
							? formatCents(Number(report.summary.discountCents) + Number(report.summary.cashbackRedeemedCents))
							: loadingValue
					}
				/>
				<StatCard
					hint={report ? "Lucro considera somente itens com custo conhecido." : loadingHint}
					label="Receita sem custo conhecido"
					value={report ? formatCents(Number(report.summary.unknownCostRevenueCents)) : loadingValue}
				/>
			</div>
		</Container>
	);
}

export const Route = createFileRoute("/admin/finance/")({ component: FinancePage });
