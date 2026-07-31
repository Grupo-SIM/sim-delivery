import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { DashboardPeriodPicker, type DashboardPeriod } from "@/routes/admin/components";
import { FinancialDistribution, FinancialTrend } from "./components";

const formatCents = (cents: number) => (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
const periods: DashboardPeriod[] = ["today", "yesterday", "week", "month", "lastMonth", "quarter", "semester", "year"];

function FinancePage() {
	const { t } = useTranslation();
	const [period, setPeriod] = useState<GetReportsFinancialQueryParamsPeriodEnumKey>("month");
	const groupBy: GetReportsFinancialQueryParamsGroupByEnumKey = "dayOfMonth";
	const { data: report, isError, isPending } = useGetReportsFinancial({ groupBy, period });
	const labels = Object.fromEntries([
		["custom", t("admin.reports.period.custom")],
		...periods.map(value => [value, t(`admin.reports.period.${value}`)]),
	]) as Record<DashboardPeriod | "custom", string>;

	if (isPending) return <Container className="space-y-6 py-8"><Skeleton className="h-16 w-80" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-64" /></Container>;
	if (isError || !report) return <Container className="py-8"><ErrorState title={t("admin.reports.loadError")} /></Container>;

	const { summary } = report;
	const cards = [
		{ change: report.comparison.netRevenuePercent, label: "Receita líquida", value: formatCents(Number(summary.netRevenueCents)) },
		{ change: report.comparison.grossProfitPercent, label: "Lucro bruto parcial", value: formatCents(Number(summary.grossProfitCents)) },
		{ change: report.comparison.grossMarginPercent, label: "Margem bruta parcial", value: summary.grossMarginPercent === null ? "—" : `${Number(summary.grossMarginPercent).toFixed(1)}%` },
		{ change: report.comparison.orderCountPercent, label: "Pedidos concluídos", value: Number(summary.orderCount) },
		{ change: report.comparison.averageOrderValuePercent, label: "Ticket médio", value: formatCents(Number(summary.averageOrderValue)) },
		{ change: null, label: "Frete", value: formatCents(Number(summary.deliveryFeeCents)) },
	];
	const trend = report.trend.map(row => ({ ...row, netRevenueCents: Number(row.netRevenueCents) }));
	const payment = report.distribution.payment.map(row => ({ ...row, netRevenueCents: Number(row.netRevenueCents), orderCount: Number(row.orderCount) }));
	const delivery = report.distribution.delivery.map(row => ({ ...row, netRevenueCents: Number(row.netRevenueCents), orderCount: Number(row.orderCount) }));

	return <Container className="space-y-6 py-8">
		<div className="flex flex-wrap items-end justify-between gap-4">
			<SectionHeading subtitle="Resultado consolidado por competência financeira." title="Relatório financeiro" />
			<div className="flex items-center gap-2"><DashboardPeriodPicker labels={labels} onChange={setPeriod} period={period} /><Button onClick={() => void exportReports({ period })} variant="outline">{t("admin.reports.export.button")}</Button></div>
		</div>
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <StatCard hint={typeof card.change === "number" ? `${card.change >= 0 ? "+" : ""}${card.change.toFixed(1)}% vs. período anterior` : undefined} key={card.label} label={card.label} value={card.value} />)}</div>
		{Number(summary.orderCount) === 0 ? <><EmptyState className="py-5" description="O relatório considera pedidos entregues ou retirados. Se você já possui pedidos concluídos, ajuste o período selecionado." title="Ainda não há dados financeiros neste período" /><section><h2 className="mb-3 font-semibold text-base">Tendência financeira</h2><Skeleton className="h-64 w-full" /></section></> : <FinancialTrend formatCents={formatCents} rows={trend} title="Tendência financeira" />}
		<div className="grid gap-6 lg:grid-cols-2"><FinancialDistribution empty="Sem dados no período." formatCents={formatCents} rows={payment} title="Receita por forma de pagamento" unreported="Não informado" /><FinancialDistribution empty="Sem dados no período." formatCents={formatCents} rows={delivery} title="Receita por modalidade de entrega" unreported="Não informado" /></div>
		<div className="grid gap-4 sm:grid-cols-3"><StatCard label="Faturamento bruto" value={formatCents(Number(summary.grossRevenueCents))} /><StatCard label="Descontos e cashback" value={formatCents(Number(summary.discountCents) + Number(summary.cashbackRedeemedCents))} /><StatCard hint="Lucro considera somente itens com custo conhecido." label="Receita sem custo conhecido" value={formatCents(Number(summary.unknownCostRevenueCents))} /></div>
	</Container>;
}

export const Route = createFileRoute("/admin/finance/")({ component: FinancePage });
