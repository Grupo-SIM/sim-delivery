import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBike, LuShoppingBag, LuUserRound } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import type { GetOrders200 } from "@/lib/api";
import { AssignCourierModal } from "./AssignCourierModal";
import { AssignKitchenModal } from "./AssignKitchenModal";
import { OrderSummaryModal } from "@/components/orders";

interface OrderKanbanCardProps {
	canManageAssignments: boolean;
	canDrag: boolean;
	onDragEnd: () => void;
	onDragStart: (orderId: string) => void;
	order: GetOrders200[number];
}

export function OrderKanbanCard({
	canDrag,
	canManageAssignments,
	onDragEnd,
	onDragStart,
	order,
}: OrderKanbanCardProps) {
	const { t } = useTranslation();
	const [assignOpen, setAssignOpen] = useState(false);
	const [assignKitchenOpen, setAssignKitchenOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const DeliveryIcon = order.deliveryMethod === "delivery" ? LuBike : LuShoppingBag;
	const isDeliveryOrder = order.deliveryMethod === "delivery";
	const hasDeliveryAssigned = !!order.delivery;
	const canAssign = order.status === "pronto" && isDeliveryOrder && !hasDeliveryAssigned;
	const kitchenStatuses = new Set(["recebido", "em_preparo", "pronto", "retirado", "cancelado"]);
	const showsKitchenAssignee =
		kitchenStatuses.has(order.status) && !(order.status === "pronto" && isDeliveryOrder);
	const showsCourierAssignee =
		["pronto", "saiu_para_entrega", "entregue"].includes(order.status) && isDeliveryOrder;
	const canAssignKitchen = kitchenStatuses.has(order.status);

	const visibleItems = order.items.slice(0, 2);
	const remainingItems = order.items.length - visibleItems.length;
	const prepTime =
		order.unitPrepTimeMinMinutes != null && order.unitPrepTimeMaxMinutes != null
			? `${order.unitPrepTimeMinMinutes}-${order.unitPrepTimeMaxMinutes} min`
			: order.unitPrepTimeMinMinutes != null
				? `${order.unitPrepTimeMinMinutes} min`
				: null;
	const etaLabel =
		order.unitPrepTimeMinMinutes != null && order.unitPrepTimeMaxMinutes != null
			? t("admin.orders.assignment.estimatedTime", {
					max: order.unitPrepTimeMaxMinutes,
					min: order.unitPrepTimeMinMinutes,
				})
			: prepTime;

	return (
		<article
			className={`rounded-md border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md ${
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
						<p className="mt-1 truncate text-muted-foreground text-sm">{order.unitName}</p>
					</div>
				</div>

				<div className="mt-4 grid gap-2 text-sm">
					<div className="flex items-center justify-between gap-3 text-muted-foreground">
						<div className="flex min-w-0 items-center gap-2">
							<DeliveryIcon className="size-4 shrink-0" />
							<span>
								{t(`store.checkout.order.${order.deliveryMethod}`, { defaultValue: order.deliveryMethod })}
							</span>
						</div>
						{etaLabel && <span className="shrink-0">{etaLabel}</span>}
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
					{showsKitchenAssignee && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<LuUserRound className="size-4 shrink-0" />
							<span>{order.preparedBy?.name ?? "-"}</span>
						</div>
					)}
					{showsCourierAssignee && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<LuUserRound className="size-4 shrink-0" />
							<span>{order.delivery?.courierName ?? "-"}</span>
						</div>
					)}
				</div>
			</button>

			{canManageAssignments && (canAssign || canAssignKitchen) && (
				<div className="mt-4 flex flex-wrap gap-2 border-border border-t pt-3">
					{canAssignKitchen && (
						<Button onClick={() => setAssignKitchenOpen(true)} size="sm" type="button" variant="outline">
							<LuUserRound aria-hidden className="size-4" />
							{t("admin.orders.assignment.assignKitchen")}
						</Button>
					)}
					{canAssign && (
						<Button onClick={() => setAssignOpen(true)} size="sm" type="button" variant="outline">
							<LuUserRound aria-hidden className="size-4" />
							{t("admin.deliveries.assign.action")}
						</Button>
					)}
				</div>
			)}

			<AssignCourierModal isOpen={assignOpen} onClose={() => setAssignOpen(false)} orderId={order.id} />
			<AssignKitchenModal
				currentAssigneeId={order.preparedBy?.id ?? null}
				isOpen={assignKitchenOpen}
				onClose={() => setAssignKitchenOpen(false)}
				orderId={order.id}
				status={order.status as "recebido" | "em_preparo" | "pronto" | "retirado" | "cancelado"}
			/>
			<OrderSummaryModal onClose={() => setDetailsOpen(false)} order={detailsOpen ? order : null} view="orders" />
		</article>
	);
}
