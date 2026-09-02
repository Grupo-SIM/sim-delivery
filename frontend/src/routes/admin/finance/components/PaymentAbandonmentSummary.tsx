import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";

interface PaymentAbandonment {
	abandonedOrderCount: number;
	abandonedValueCents: number;
	averageAbandonedTicket: number;
}

interface PaymentAbandonmentSummaryProps {
	formatCents: (value: number) => string;
	isPending: boolean;
	paymentAbandonment?: PaymentAbandonment;
}

export function PaymentAbandonmentSummary({
	formatCents,
	isPending,
	paymentAbandonment,
}: PaymentAbandonmentSummaryProps) {
	const { t } = useTranslation();
	const loadingValue = <Skeleton className="h-6 w-24" />;

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">
				{t("admin.reports.finance.paymentAbandonment.title")}
			</h2>
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					label={t("admin.reports.finance.paymentAbandonment.count")}
					value={
						isPending || !paymentAbandonment ? loadingValue : paymentAbandonment.abandonedOrderCount
					}
				/>
				<StatCard
					label={t("admin.reports.finance.paymentAbandonment.value")}
					value={
						isPending || !paymentAbandonment
							? loadingValue
							: formatCents(paymentAbandonment.abandonedValueCents)
					}
				/>
				<StatCard
					label={t("admin.reports.finance.paymentAbandonment.averageTicket")}
					value={
						isPending || !paymentAbandonment
							? loadingValue
							: formatCents(paymentAbandonment.averageAbandonedTicket)
					}
				/>
			</div>
		</section>
	);
}
