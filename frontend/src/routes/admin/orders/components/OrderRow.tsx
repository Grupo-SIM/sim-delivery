import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetOrders200 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UpdateStatusModal } from "./UpdateStatusModal";

const TERMINAL = new Set(["entregue", "retirado", "cancelado"]);

interface OrderRowProps {
	order: GetOrders200[number];
}

export function OrderRow({ order }: OrderRowProps) {
	const { t } = useTranslation();
	const [modalOpen, setModalOpen] = useState(false);

	const date = new Date(order.createdAt).toLocaleString("pt-BR", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "2-digit",
	});

	const totalBRL = (Number(order.total) / 100).toLocaleString("pt-BR", {
		currency: "BRL",
		style: "currency",
	});

	const isTerminal = TERMINAL.has(order.status);

	return (
		<>
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 text-muted-foreground text-sm">{date}</td>
				<td className="px-4 py-3 font-medium">{order.customerName}</td>
				<td className="px-4 py-3 text-muted-foreground text-sm">{order.unitName}</td>
				<td className="px-4 py-3 text-sm">
					<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
						{t(`admin.orders.status.${order.status}`, { defaultValue: order.status })}
					</span>
				</td>
				<td className="px-4 py-3 text-muted-foreground text-sm">
					{t(`admin.orders.columns.method`) === "Method"
						? order.deliveryMethod
						: order.deliveryMethod}
					{" · "}
					{t("admin.orders.items", { count: order.items.length })}
				</td>
				<td className="px-4 py-3 font-medium text-sm">{totalBRL}</td>
				<td className="px-4 py-3 text-right">
					{!isTerminal && (
						<Button onClick={() => setModalOpen(true)} size="sm" type="button" variant="outline">
							{t("admin.orders.updateStatus.action")}
						</Button>
					)}
				</td>
			</tr>

			<UpdateStatusModal
				currentStatus={order.status}
				deliveryMethod={order.deliveryMethod}
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				orderId={order.id}
			/>
		</>
	);
}
