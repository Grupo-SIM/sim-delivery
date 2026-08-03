import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetReportsProductProfitability } from "@/lib/api";
import {
	DashboardDateRangePicker,
	type DashboardPeriodSelection,
	DashboardUnitPicker,
} from "@/routes/admin/components";
import {
	ProductCostBreakdownModal,
	type ProductProfitabilityRow,
	ProductProfitabilityTable,
} from "./components";

const formatCents = (cents: number) =>
	(cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });

function ProductProfitabilityPage() {
	const { t } = useTranslation();
	const [period, setPeriod] = useState<DashboardPeriodSelection>("month");
	const [dateRange, setDateRange] = useState<{ endDate: string; startDate: string } | null>(null);
	const [unitId, setUnitId] = useState("");
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<ProductProfitabilityRow | null>(null);
	const queryPeriod = period === "custom" ? undefined : period;

	const {
		data: products,
		isError,
		isPending,
	} = useGetReportsProductProfitability({
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

	const rows: ProductProfitabilityRow[] = useMemo(
		() =>
			(products ?? []).map(product => ({
				grossMarginPercent: product.grossMarginPercent ?? null,
				grossProfitCents: Number(product.grossProfitCents ?? 0),
				hasRecipe: product.hasRecipe,
				ingredients: product.ingredients.map(ingredient => ({
					...ingredient,
					costCents: Number(ingredient.costCents),
					unitCostCents: Number(ingredient.unitCostCents),
				})),
				knownCostCents: Number(product.knownCostCents ?? 0),
				priceCents: product.priceCents === null ? null : Number(product.priceCents),
				productId: product.productId,
				productName: product.productName,
				theoreticalCostCents:
					product.theoreticalCostCents === null ? null : Number(product.theoreticalCostCents),
				theoreticalMarginPercent: product.theoreticalMarginPercent ?? null,
				theoreticalProfitCents:
					product.theoreticalProfitCents === null ? null : Number(product.theoreticalProfitCents),
				totalQuantity: Number(product.totalQuantity),
				totalRevenue: Number(product.totalRevenue),
			})),
		[products],
	);

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter(row => row.productName.toLowerCase().includes(query));
	}, [rows, search]);

	return (
		<Container className="space-y-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<SectionHeading
					subtitle={t("admin.reports.finance.products.subtitle")}
					title={t("admin.reports.finance.products.title")}
				/>
				<div className="flex items-center gap-2">
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
				</div>
			</div>

			<div className="max-w-sm">
				<TextField
					label={t("admin.products.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.products.search.placeholder")}
					value={search}
				/>
			</div>

			{isPending ? (
				<Skeleton className="h-96 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.reports.loadError")} />
			) : (
				<ProductProfitabilityTable formatCents={formatCents} onSelect={setSelected} rows={filteredRows} />
			)}

			<ProductCostBreakdownModal
				formatCents={formatCents}
				onClose={() => setSelected(null)}
				product={selected}
			/>
		</Container>
	);
}

export const Route = createFileRoute("/admin/finance/products/")({ component: ProductProfitabilityPage });
