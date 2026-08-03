import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";

interface PeakItem {
	label: string;
	orderCount: number;
}

interface OperationsMetricsProps {
	isPending: boolean;
	operations?: {
		averageDeliveryMinutes: number | null;
		averageFulfillmentMinutes: number | null;
		averagePrepMinutes: number | null;
		peaks: { byDayOfWeek: PeakItem[]; byHourOfDay: PeakItem[] };
		problemRatePercent: number;
	};
}

function formatMinutes(minutes: number | null | undefined, noData: string): string {
	if (minutes == null) return noData;
	return `${minutes.toFixed(0)} min`;
}

function PeaksChart({ rows, title }: { rows: PeakItem[]; title: string }) {
	const maximum = Math.max(1, ...rows.map(row => row.orderCount));
	return (
		<div>
			<h3 className="mb-2 font-medium text-sm">{title}</h3>
			<div aria-label={title} className="flex h-24 items-end gap-1" role="img">
				{rows.map(row => (
					<div className="flex h-full flex-1 flex-col justify-end" key={row.label}>
						<div
							className="rounded-t bg-primary"
							style={{ height: `${Math.max(2, (row.orderCount / maximum) * 100)}%` }}
						/>
						<span className="mt-1 text-center text-[9px] text-muted-foreground">{row.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function OperationsMetrics({ isPending, operations }: OperationsMetricsProps) {
	const { t } = useTranslation();
	const noData = t("admin.reports.summary.noKnownCost");
	const loadingValue = <Skeleton className="h-6 w-16" />;

	const cards = [
		{
			label: t("admin.reports.finance.operations.prepTime"),
			value: isPending ? loadingValue : formatMinutes(operations?.averagePrepMinutes, noData),
		},
		{
			label: t("admin.reports.finance.operations.deliveryTime"),
			value: isPending ? loadingValue : formatMinutes(operations?.averageDeliveryMinutes, noData),
		},
		{
			label: t("admin.reports.finance.operations.fulfillmentTime"),
			value: isPending ? loadingValue : formatMinutes(operations?.averageFulfillmentMinutes, noData),
		},
		{
			label: t("admin.reports.finance.operations.problemRate"),
			value: isPending ? loadingValue : `${(operations?.problemRatePercent ?? 0).toFixed(1)}%`,
		},
	];

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{t("admin.reports.finance.operations.title")}</h2>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{cards.map(card => (
					<StatCard key={card.label} label={card.label} value={card.value} />
				))}
			</div>
			<ScrollArea className="mt-4 overflow-x-auto rounded-md border border-border bg-card p-5">
				{isPending || !operations ? (
					<Skeleton className="h-24" />
				) : (
					<div className="grid gap-6 sm:grid-cols-2">
						<PeaksChart
							rows={operations.peaks.byHourOfDay}
							title={t("admin.reports.finance.operations.byHour")}
						/>
						<PeaksChart
							rows={operations.peaks.byDayOfWeek}
							title={t("admin.reports.finance.operations.byWeekday")}
						/>
					</div>
				)}
			</ScrollArea>
		</section>
	);
}
