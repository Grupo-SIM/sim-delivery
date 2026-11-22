import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/formatMoney";

interface MetricOrder {
	payment: { status: string } | null;
	refundedCents: number | string;
	status: string;
	total: number | string;
}

interface OriginMetricsProps {
	orders: MetricOrder[];
}

/** Orders, revenue and average ticket of the sold orders currently listed on the board (same filters). */
export function OriginMetrics({ orders }: OriginMetricsProps) {
	const { t } = useTranslation();
	const sold = orders.filter(
		order => order.status !== "cancelado" && ["confirmed", "partially_refunded"].includes(order.payment?.status ?? ""),
	);
	const revenueCents = sold.reduce((sum, order) => sum + Number(order.total) - Number(order.refundedCents), 0);
	const averageTicketCents = sold.length ? Math.round(revenueCents / sold.length) : 0;
	return (
		<div className="grid shrink-0 gap-3 sm:grid-cols-3">
			<StatCard label={t("admin.orders.origin.metrics.orders")} value={sold.length} />
			<StatCard label={t("admin.orders.origin.metrics.revenue")} value={formatMoney(revenueCents / 100)} />
			<StatCard label={t("admin.orders.origin.metrics.ticket")} value={formatMoney(averageTicketCents / 100)} />
		</div>
	);
}
