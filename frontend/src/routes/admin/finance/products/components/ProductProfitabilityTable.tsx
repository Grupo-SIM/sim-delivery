import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChartPie } from "react-icons/lu";
import { DataTable } from "@/components/ui/DataTable";
import { Tooltip } from "@/components/ui/Tooltip";

export interface ProductProfitabilityRow {
	grossMarginPercent: number | null;
	grossProfitCents: number;
	hasRecipe: boolean;
	ingredients: {
		costCents: number;
		costSharePercent: number;
		inventoryItemId: string;
		name: string;
		quantity: number;
		unit: string;
		unitCostCents: number;
	}[];
	knownCostCents: number;
	priceCents: number | null;
	productId: string;
	productName: string;
	theoreticalCostCents: number | null;
	theoreticalMarginPercent: number | null;
	theoreticalProfitCents: number | null;
	totalQuantity: number;
	totalRevenue: number;
}

type SortKey =
	| "grossMarginPercent"
	| "productName"
	| "theoreticalMarginPercent"
	| "totalQuantity"
	| "totalRevenue";

interface ProductProfitabilityTableProps {
	formatCents: (value: number) => string;
	onSelect: (product: ProductProfitabilityRow) => void;
	rows: ProductProfitabilityRow[];
}

export function ProductProfitabilityTable({ formatCents, onSelect, rows }: ProductProfitabilityTableProps) {
	const { t } = useTranslation();
	const [sort, setSort] = useState<{ direction: "asc" | "desc"; key: SortKey }>({
		direction: "desc",
		key: "totalRevenue",
	});
	const noKnownCost = t("admin.reports.summary.noKnownCost");
	const noRecipe = t("admin.reports.finance.products.noRecipe");

	const sorted = useMemo(() => {
		const factor = sort.direction === "asc" ? 1 : -1;
		return [...rows].sort((a, b) => {
			const left = a[sort.key];
			const right = b[sort.key];
			if (left === null) return 1;
			if (right === null) return -1;
			if (typeof left === "string" || typeof right === "string")
				return factor * String(left).localeCompare(String(right));
			return factor * ((left ?? 0) - (right ?? 0));
		});
	}, [rows, sort]);

	const toggleSort = (key: SortKey) =>
		setSort(current =>
			current.key === key
				? { direction: current.direction === "asc" ? "desc" : "asc", key }
				: { direction: "desc", key },
		);

	const columns: { key: SortKey; label: string }[] = [
		{ key: "productName", label: t("admin.reports.bestSellers.columns.product") },
		{ key: "totalQuantity", label: t("admin.reports.bestSellers.columns.quantity") },
		{ key: "totalRevenue", label: t("admin.reports.bestSellers.columns.revenue") },
		{ key: "grossMarginPercent", label: t("admin.reports.finance.products.realizedMargin") },
		{ key: "theoreticalMarginPercent", label: t("admin.reports.finance.products.theoreticalMargin") },
	];

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					{columns.map(column => (
						<th className="cursor-pointer select-none p-3 text-right first:text-left" key={column.key}>
							<button
								className="inline-flex cursor-pointer items-center gap-1 font-medium"
								onClick={() => toggleSort(column.key)}
								type="button"
							>
								{column.label}
								{sort.key === column.key ? (sort.direction === "asc" ? "▲" : "▼") : null}
							</button>
						</th>
					))}
					<th className="p-3 text-right">{t("admin.reports.finance.products.columns.details")}</th>
				</tr>
			</thead>
			<tbody>
				{sorted.length === 0 ? (
					<tr>
						<td className="p-8 text-center text-muted-foreground" colSpan={6}>
							{t("admin.reports.empty")}
						</td>
					</tr>
				) : (
					sorted.map(row => (
						<tr className="border-border/60 border-b last:border-0" key={row.productId}>
							<td className="p-3 font-medium">{row.productName}</td>
							<td className="p-3 text-right">{row.totalQuantity}</td>
							<td className="p-3 text-right">{formatCents(row.totalRevenue)}</td>
							<td className="p-3 text-right">
								{row.grossMarginPercent === null ? noKnownCost : `${row.grossMarginPercent.toFixed(1)}%`}
							</td>
							<td className="p-3 text-right">
								{row.theoreticalMarginPercent === null
									? noRecipe
									: `${row.theoreticalMarginPercent.toFixed(1)}%`}
							</td>
							<td className="p-3 text-right">
								<Tooltip content={t("admin.reports.finance.products.viewBreakdown")}>
									<button
										aria-label={t("admin.reports.finance.products.viewBreakdown")}
										className="grid size-8 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
										onClick={() => onSelect(row)}
										type="button"
									>
										<LuChartPie className="size-4" />
									</button>
								</Tooltip>
							</td>
						</tr>
					))
				)}
			</tbody>
		</DataTable>
	);
}
