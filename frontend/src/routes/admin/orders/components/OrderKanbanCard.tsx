import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBike, LuChefHat, LuShoppingBag } from "react-icons/lu";
import { OrderSummaryModal } from "@/components/orders";
import { Button } from "@/components/ui/button";
import type { GetOrders200 } from "@/lib/api";
import { AssignCourierModal } from "./AssignCourierModal";
import { AssignKitchenModal } from "./AssignKitchenModal";
import { OrderReceiptButton } from "./OrderReceiptButton";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderKanbanCardProps {
	canManageAssignments: boolean;
	canPrint: boolean;
	canDrag: boolean;
	onDragEnd: () => void;
	onDragStart: (orderId: string) => void;
	order: GetOrders200[number];
	showStatus?: boolean;
}

export function OrderKanbanCard({
	canDrag,
	canManageAssignments,
	canPrint,
	onDragEnd,
	onDragStart,
	order,
	showStatus = false,
}: OrderKanbanCardProps) {
	const { t } = useTranslation();
	const [assignOpen, setAssignOpen] = useState(false);
	const [assignKitchenOpen, setAssignKitchenOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const DeliveryIcon = order.deliveryMethod === "delivery" ? LuBike : LuShoppingBag;
	const isDeliveryOrder = order.deliveryMethod === "delivery";
	const canAssignCourier = order.status === "pronto" && isDeliveryOrder;
	const canAssignKitchen = order.status === "recebido" || order.status === "em_preparo";

	const visibleItems = order.items.slice(0, 2);
	const remainingItems = order.items.length - visibleItems.length;
	const phaseDeadline = order.estimatedStatusCompletionAt
		? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
				new Date(order.estimatedStatusCompletionAt),
			)
		: null;

	return (
		<article
			className={`relative rounded-md border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md ${
				canPrint ? "pb-16" : ""
			} ${
				canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"
			}`}
			draggable={canDrag}
			onDragEnd={onDragEnd}
			onDragStart={event => {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("text/plain", order.id);
				onDragStart(order.id);
			}}
		>
			<button
				aria-label={t("admin.customers.orders.view")}
				className="block w-full cursor-pointer text-left"
				onClick={() => setDetailsOpen(true)}
				type="button"
			>
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate font-semibold text-base">{order.customerName}</p>
						<p className="mt-1 font-semibold text-primary text-sm">
							{t("admin.orders.receipt.order")} #{order.displayNumber}
						</p>
						<p className="mt-1 truncate text-muted-foreground text-sm">{order.unitName}</p>
					</div>
					{showStatus && <OrderStatusBadge status={order.status} />}
				</div>

				<div className="mt-4 grid gap-2 text-sm">
					<div className="flex items-center justify-between gap-3 text-muted-foreground">
						<div className="flex min-w-0 items-center gap-2">
							<DeliveryIcon className="size-4 shrink-0" />
							<span>
								{t(`store.checkout.order.${order.deliveryMethod}`, { defaultValue: order.deliveryMethod })}
							</span>
						</div>
						{phaseDeadline && <span className="shrink-0">Prazo {phaseDeadline}</span>}
					</div>
					<ul className="space-y-1 text-foreground text-sm">
						{visibleItems.map(item => (
							<li className="flex justify-between gap-3" key={item.id}>
								<span className="truncate">{item.productName}</span>
								<span className="shrink-0 text-muted-foreground">{Number(item.quantity)}×</span>
							</li>
						))}
						{remainingItems > 0 && (
							<li className="text-muted-foreground text-xs">
								+{remainingItems} {t("admin.orders.items", { count: remainingItems })}
							</li>
						)}
					</ul>
				</div>
			</button>

			{canManageAssignments && (canAssignCourier || canAssignKitchen) && (
				<div className="mt-4 flex flex-wrap gap-2 border-border border-t pt-3">
					{canAssignKitchen && (
						<Button onClick={() => setAssignKitchenOpen(true)} size="sm" type="button" variant="outline">
							<LuChefHat aria-hidden className="size-4" />
							<span className="max-w-32 truncate">
								{order.preparedBy?.name ?? t("admin.orders.assignment.assign")}
							</span>
						</Button>
					)}
					{canAssignCourier && (
						<Button onClick={() => setAssignOpen(true)} size="sm" type="button" variant="outline">
							<LuBike aria-hidden className="size-4" />
							<span className="max-w-32 truncate">
								{order.delivery?.courierName ?? t("admin.orders.assignment.assign")}
							</span>
						</Button>
					)}
				</div>
			)}
			{canPrint && (
				<div className="absolute right-4 bottom-4">
					<OrderReceiptButton orderId={order.id} />
				</div>
			)}

			<AssignCourierModal
				currentCourierId={order.delivery?.courierId}
				isOpen={assignOpen}
				onClose={() => setAssignOpen(false)}
				orderId={order.id}
			/>
			<AssignKitchenModal
				currentAssigneeId={order.preparedBy?.id ?? null}
				currentAssigneeName={order.preparedBy?.name ?? null}
				isOpen={assignKitchenOpen}
				onClose={() => setAssignKitchenOpen(false)}
				orderId={order.id}
				status={order.status as "recebido" | "em_preparo"}
			/>
			<OrderSummaryModal
				onClose={() => setDetailsOpen(false)}
				order={detailsOpen ? order : null}
				view="orders"
			/>
		</article>
	);
}
