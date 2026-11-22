import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBike, LuPencil, LuShoppingBag } from "react-icons/lu";
import { OrderSummaryModal } from "@/components/orders";
import { Button } from "@/components/ui/button";
import type { GetOrders200 } from "@/lib/api";
import { OrderReceiptButton } from "../OrderReceiptButton";
import { OrderStatusBadge } from "../OrderStatusBadge";
import { UpdateStatusModal } from "../UpdateStatusModal";

const TERMINAL_STATUSES = ["entregue", "retirado", "cancelado", "awaiting_payment", "falta_de_pagamento"];

interface OrderCompactCardProps {
	canPrint: boolean;
	order: GetOrders200[number];
	showStatus: boolean;
}

export function OrderCompactCard({ canPrint, order, showStatus }: OrderCompactCardProps) {
	const { t } = useTranslation();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [statusOpen, setStatusOpen] = useState(false);
	const DeliveryIcon = order.deliveryMethod === "delivery" ? LuBike : LuShoppingBag;
	const canChangeStatus = !TERMINAL_STATUSES.includes(order.status);
	const itemCount = order.items.reduce((total, item) => total + Number(item.quantity), 0);

	return (
		<article className="flex items-center gap-2 rounded-md border border-border bg-card p-2 shadow-sm">
			<button
				aria-label={t("admin.customers.orders.view")}
				className="min-w-0 flex-1 cursor-pointer text-left"
				onClick={() => setDetailsOpen(true)}
				type="button"
			>
				<p className="truncate font-semibold text-sm">
					<span className="text-primary">#{order.displayNumber}</span> {order.customerName}
				</p>
				<p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
					<DeliveryIcon aria-hidden className="size-3.5 shrink-0" />
					<span className="truncate">
						{t(`store.checkout.order.${order.deliveryMethod}`, { defaultValue: order.deliveryMethod })} ·{" "}
						{t("admin.orders.items", { count: itemCount })}
					</span>
				</p>
				{showStatus && (
					<div className="mt-1">
						<OrderStatusBadge status={order.status} />
					</div>
				)}
			</button>
			<div className="flex shrink-0 items-center gap-1">
				{canChangeStatus && (
					<Button
						aria-label={t("admin.orders.updateStatus.action")}
						onClick={() => setStatusOpen(true)}
						size="icon"
						type="button"
						variant="outline"
					>
						<LuPencil aria-hidden className="size-4" />
					</Button>
				)}
				{canPrint && <OrderReceiptButton orderId={order.id} />}
			</div>
			<OrderSummaryModal onClose={() => setDetailsOpen(false)} order={detailsOpen ? order : null} view="orders" />
			<UpdateStatusModal
				currentStatus={order.status}
				deliveryMethod={order.deliveryMethod}
				isOpen={statusOpen}
				onClose={() => setStatusOpen(false)}
				orderId={order.id}
				orderTotal={Number(order.total)}
				paymentStatus={order.payment?.status ?? null}
			/>
		</article>
	);
}
