import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";

interface CustomerMetricsProps {
	customers?: {
		newCustomers: number;
		ordersPerCustomer: number;
		repeatRatePercent: number;
		returningCustomers: number;
		revenuePerCustomer: number;
	};
	formatCents: (value: number) => string;
	isPending: boolean;
}

export function CustomerMetrics({ customers, formatCents, isPending }: CustomerMetricsProps) {
	const { t } = useTranslation();
	const loadingValue = <Skeleton className="h-6 w-16" />;

	const cards = [
		{ label: t("admin.reports.finance.customers.new"), value: customers?.newCustomers },
		{ label: t("admin.reports.finance.customers.returning"), value: customers?.returningCustomers },
		{
			label: t("admin.reports.finance.customers.repeatRate"),
			value: customers ? `${customers.repeatRatePercent.toFixed(1)}%` : undefined,
		},
		{
			label: t("admin.reports.finance.customers.ordersPerCustomer"),
			value: customers ? customers.ordersPerCustomer.toFixed(1) : undefined,
		},
		{
			label: t("admin.reports.finance.customers.revenuePerCustomer"),
			value: customers ? formatCents(customers.revenuePerCustomer) : undefined,
		},
	];

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{t("admin.reports.finance.customers.title")}</h2>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				{cards.map(card => (
					<StatCard key={card.label} label={card.label} value={isPending ? loadingValue : card.value} />
				))}
			</div>
		</section>
	);
}
