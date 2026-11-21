import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetOrdersOriginMetrics } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";

interface OriginMetricsProps {
	from?: string;
	search?: string;
	to?: string;
	unitId?: string;
	utmContent?: string;
	utmMedium?: string;
	utmSource?: string;
}

/** Orders, revenue and average ticket for the orders matching the page filters (sold orders only). */
export function OriginMetrics({ from, search, to, unitId, utmContent, utmMedium, utmSource }: OriginMetricsProps) {
	const { t } = useTranslation();
	const { data, isError, isPending } = useGetOrdersOriginMetrics({
		...(from ? { from } : {}),
		...(search ? { search } : {}),
		...(to ? { to } : {}),
		...(unitId ? { unitId } : {}),
		...(utmContent ? { utmContent } : {}),
		...(utmMedium ? { utmMedium } : {}),
		...(utmSource ? { utmSource } : {}),
	});
	if (isError) return null;
	return (
		<div className="grid shrink-0 gap-3 sm:grid-cols-3">
			{isPending ? (
				[0, 1, 2].map(index => <Skeleton className="h-[5.5rem] w-full" key={index} />)
			) : (
				<>
					<StatCard label={t("admin.orders.origin.metrics.orders")} value={data.totals.orders} />
					<StatCard label={t("admin.orders.origin.metrics.revenue")} value={formatMoney(Number(data.totals.revenueCents) / 100)} />
					<StatCard label={t("admin.orders.origin.metrics.ticket")} value={formatMoney(Number(data.totals.averageTicketCents) / 100)} />
				</>
			)}
		</div>
	);
}
