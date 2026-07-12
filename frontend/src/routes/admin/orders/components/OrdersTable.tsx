import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetOrders200 } from "@/lib/api";
import { OrderRow } from "./OrderRow";

interface OrdersTableProps {
	orders: GetOrders200;
}

export function OrdersTable({ orders }: OrdersTableProps) {
	const { t } = useTranslation();

	if (orders.length === 0) {
		return <EmptyState title={t("admin.orders.empty")} />;
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.orders.columns.date")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.orders.columns.customer")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.orders.columns.unit")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.orders.columns.status")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.orders.columns.method")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.orders.columns.total")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{orders.map(order => (
					<OrderRow key={order.id} order={order} />
				))}
			</tbody>
		</DataTable>
	);
}
