import { useState } from "react";
import { LuBike, LuCircleDollarSign, LuShoppingBag, LuUserRound } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { GetOrders200 } from "@/lib/api";
import { AssignCourierModal } from "./AssignCourierModal";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderKanbanCardProps {
	onDragEnd: () => void;
	onDragStart: (orderId: string) => void;
	order: GetOrders200[number];
}

export function OrderKanbanCard({ onDragEnd, onDragStart, order }: OrderKanbanCardProps) {
	const { t } = useTranslation();
	const [assignOpen, setAssignOpen] = useState(false);

	const DeliveryIcon = order.deliveryMethod === "delivery" ? LuBike : LuShoppingBag;
	const isDeliveryOrder = order.deliveryMethod === "delivery";
	const hasDeliveryAssigned = !!order.delivery;
	const canAssign = order.status === "pronto" && isDeliveryOrder && !hasDeliveryAssigned;

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

	return (
		<article
			className="cursor-grab rounded-md border border-border bg-card p-4 shadow-sm transition active:cursor-grabbing hover:border-primary/40 hover:shadow-md"
			draggable
			onDragEnd={onDragEnd}
			onDragStart={event => {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("text/plain", order.id);
				onDragStart(order.id);
			}}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate font-semibold text-base">{order.customerName}</p>
					<p className="mt-1 truncate text-muted-foreground text-sm">{order.unitName}</p>
				</div>
				<OrderStatusBadge status={order.status} />
			</div>

			<div className="mt-4 grid gap-2 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<DeliveryIcon className="size-4 shrink-0" />
					<span>{order.deliveryMethod}</span>
					<span>·</span>
					<span>{t("admin.orders.items", { count: order.items.length })}</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<LuCircleDollarSign className="size-4 shrink-0" />
					<span className="font-medium text-foreground">{totalBRL}</span>
					<span>·</span>
					<span>{date}</span>
				</div>
				{isDeliveryOrder && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<LuUserRound className="size-4 shrink-0" />
						<span>
							{hasDeliveryAssigned
								? t("admin.deliveries.assign.assigned")
								: t("admin.deliveries.assign.needsCourier")}
						</span>
					</div>
				)}
			</div>

			{canAssign && (
				<div className="mt-4 flex flex-wrap gap-2 border-border border-t pt-3">
					<Button onClick={() => setAssignOpen(true)} size="sm" type="button" variant="outline">
						<LuUserRound aria-hidden className="size-4" />
						{t("admin.deliveries.assign.action")}
					</Button>
				</div>
			)}

			<AssignCourierModal isOpen={assignOpen} onClose={() => setAssignOpen(false)} orderId={order.id} />
		</article>
	);
}
