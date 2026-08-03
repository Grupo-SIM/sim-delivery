import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";

interface Cancellation {
	averageCanceledTicket: number;
	cancelRatePercent: number;
	canceledOrderCount: number;
	lostRevenueCents: number;
	pendingRefundCents: number;
	refundedCents: number;
	wastedCostCents: number;
}

interface CancellationSummaryProps {
	cancellation?: Cancellation;
	cancelRatePercentPoints: number | null;
	formatCents: (value: number) => string;
	isPending: boolean;
}

export function CancellationSummary({
	cancellation,
	cancelRatePercentPoints,
	formatCents,
	isPending,
}: CancellationSummaryProps) {
	const { t } = useTranslation();
	const loadingValue = <Skeleton className="h-6 w-24" />;
	const loadingHint = <Skeleton className="h-[11px] w-24" />;

	const cards: { hint?: ReactNode; label: string; tone?: "destructive"; value: ReactNode }[] = cancellation
		? [
				{
					hint:
						typeof cancelRatePercentPoints === "number"
							? `${cancelRatePercentPoints >= 0 ? "+" : ""}${cancelRatePercentPoints.toFixed(1)} p.p. ${t("admin.reports.finance.vsPreviousPeriod")}`
							: undefined,
					label: t("admin.reports.finance.cancellation.rate"),
					value: `${cancellation.cancelRatePercent.toFixed(1)}%`,
				},
				{ label: t("admin.reports.finance.cancellation.count"), value: cancellation.canceledOrderCount },
				{
					label: t("admin.reports.finance.cancellation.lostRevenue"),
					tone: "destructive",
					value: formatCents(cancellation.lostRevenueCents),
				},
				{
					label: t("admin.reports.finance.cancellation.averageTicket"),
					value: formatCents(cancellation.averageCanceledTicket),
				},
				{
					hint: t("admin.reports.finance.cancellation.wastedHint"),
					label: t("admin.reports.finance.cancellation.wasted"),
					tone: "destructive",
					value: formatCents(cancellation.wastedCostCents),
				},
				{
					hint:
						cancellation.pendingRefundCents > 0
							? t("admin.reports.finance.cancellation.pendingHint")
							: undefined,
					label: t("admin.reports.finance.cancellation.pendingRefund"),
					tone: cancellation.pendingRefundCents > 0 ? "destructive" : undefined,
					value: formatCents(cancellation.pendingRefundCents),
				},
				{
					label: t("admin.reports.finance.cancellation.refunded"),
					value: formatCents(cancellation.refundedCents),
				},
			]
		: Array.from({ length: 7 }, (_, index) => ({
				hint: loadingHint,
				label: `loading-${index}`,
				value: loadingValue,
			}));

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{t("admin.reports.finance.cancellation.title")}</h2>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{cards.map(card => (
					<StatCard
						hint={isPending ? loadingHint : card.hint}
						key={card.label}
						label={isPending ? <Skeleton className="h-3 w-20" /> : card.label}
						tone={card.tone}
						value={isPending ? loadingValue : card.value}
					/>
				))}
			</div>
		</section>
	);
}
