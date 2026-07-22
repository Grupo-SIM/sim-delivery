import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuEye } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GetOrders200 } from "@/lib/api";
import { CustomerOrderDetailsModal } from "./CustomerOrderDetailsModal";

interface CustomerOrdersTableProps {
	orders: GetOrders200;
}

export function CustomerOrdersTable({ orders }: CustomerOrdersTableProps) {
	const { t } = useTranslation();
	const [selectedOrder, setSelectedOrder] = useState<GetOrders200[number] | null>(null);

	if (orders.length === 0) return <EmptyState title={t("admin.customers.detail.emptyOrders")} />;

	return (
		<>
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.date")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.unit")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.status")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.orders.total")}</th>
					<th className="px-4 py-3" />
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
						<td className="px-4 py-3 text-right">
							<Tooltip content={t("admin.customers.orders.view")}>
								<Button aria-label={t("admin.customers.orders.view")} onClick={() => setSelectedOrder(order)} size="icon" type="button" variant="outline">
									<LuEye className="size-4" />
								</Button>
							</Tooltip>
						</td>
					</tr>
				))}
			</tbody>
		</DataTable>
		<CustomerOrderDetailsModal onClose={() => setSelectedOrder(null)} order={selectedOrder} />
		</>
	);
}
