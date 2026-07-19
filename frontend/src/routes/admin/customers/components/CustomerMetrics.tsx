import { useTranslation } from "react-i18next";
import type { GetCustomersByCustomerId200 } from "@/lib/api";

interface CustomerMetricsProps {
	customer: GetCustomersByCustomerId200;
}

function currency(cents: string | number) {
	return (Number(cents) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

export function CustomerMetrics({ customer }: CustomerMetricsProps) {
	const { t } = useTranslation();
	const metrics = [
		{ label: t("admin.customers.metrics.orders"), value: customer.orderCount },
		{ label: t("admin.customers.metrics.totalSpent"), value: currency(customer.totalSpent) },
		{ label: t("admin.customers.metrics.averageTicket"), value: currency(customer.averageTicket) },
		{ label: t("admin.customers.metrics.cashback"), value: currency(customer.cashbackBalance) },
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{metrics.map(metric => (
				<div className="rounded-lg border border-border bg-card p-4" key={metric.label}>
					<p className="text-muted-foreground text-sm">{metric.label}</p>
					<p className="mt-1 font-semibold text-lg">{metric.value}</p>
				</div>
			))}
		</div>
	);
}
