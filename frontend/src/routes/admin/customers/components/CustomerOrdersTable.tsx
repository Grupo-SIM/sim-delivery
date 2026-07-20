import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetOrders200 } from "@/lib/api";

interface CustomerOrdersTableProps {
	orders: GetOrders200;
}

export function CustomerOrdersTable({ orders }: CustomerOrdersTableProps) {
	const { t } = useTranslation();

	if (orders.length === 0) return <EmptyState title={t("admin.customers.detail.emptyOrders")} />;

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.date")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.unit")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.status")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.total")}</th>
				</tr>
			</thead>
			<tbody>
				{orders.map(order => (
					<tr className="border-border/60 border-b last:border-0" key={order.id}>
						<td className="px-4 py-3 text-sm">{new Date(order.createdAt).toLocaleString("pt-BR")}</td>
						<td className="px-4 py-3 text-sm">{order.unitName}</td>
						<td className="px-4 py-3 text-sm">
							{t(`admin.orders.status.${order.status}`, { defaultValue: order.status })}
						</td>
						<td className="px-4 py-3 font-medium text-sm">
							{(Number(order.total) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" })}
						</td>
					</tr>
				))}
			</tbody>
		</DataTable>
	);
}
