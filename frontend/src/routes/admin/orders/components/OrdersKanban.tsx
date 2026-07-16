import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import {
	getOrdersQueryKey,
	type GetOrders200,
	type PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey,
	usePatchOrdersByOrderIdStatus,
} from "@/lib/api";
import { showAlert } from "@/stores";
import { OrderKanbanCard } from "./OrderKanbanCard";
import { OrderStatusBadge } from "./OrderStatusBadge";

export const KANBAN_STATUSES = [
	"awaiting_payment",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
] as const;

type KanbanStatus = (typeof KANBAN_STATUSES)[number];

const MOVABLE_STATUSES: readonly PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey[] = [
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
];

function isMovableStatus(status: KanbanStatus): status is PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey {
	return MOVABLE_STATUSES.includes(status as PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey);
}

interface OrdersKanbanProps {
	orders: GetOrders200;
	statuses: readonly KanbanStatus[];
}

export function OrdersKanban({ orders, statuses }: OrdersKanbanProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patchStatus = usePatchOrdersByOrderIdStatus();
	const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
	const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
	const ordersByStatus = useMemo(
		() =>
			statuses.map(status => ({
				orders: orders.filter(order => order.status === status),
				status,
			})),
		[orders, statuses],
	);

	if (orders.length === 0) {
		return <EmptyState title={t("admin.orders.empty")} />;
	}

	function moveOrder(orderId: string, status: KanbanStatus) {
		const order = orders.find(candidate => candidate.id === orderId);
		if (!order || order.status === status || !isMovableStatus(status)) return;
		if (status === "saiu_para_entrega" && (order.deliveryMethod !== "delivery" || !order.delivery)) {
			void showAlert(t("admin.deliveries.assign.needsCourier"));
			return;
		}
		if (status === "retirado" && order.deliveryMethod !== "pickup") return;

		const nextStatus = status as PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey;
		patchStatus.mutate(
			{ data: { status: nextStatus }, orderId },
			{
				onError: () => void showAlert(t("admin.orders.updateStatus.error")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() }),
			},
		);
	}

	return (
		<div className="-mx-5 overflow-x-auto px-5 pb-3">
			<div className="flex min-w-max gap-3">
				{ordersByStatus.map(column => {
					const isDropTarget = dragOverStatus === column.status;
					return (
						<section
							className={`min-h-[36rem] w-[280px] shrink-0 rounded-2xl border bg-muted/35 transition ${
								isDropTarget ? "border-primary bg-primary/5" : "border-border"
							}`}
							key={column.status}
							onDragLeave={event => {
								if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverStatus(null);
							}}
							onDragOver={event => {
								event.preventDefault();
								event.dataTransfer.dropEffect = "move";
								setDragOverStatus(column.status);
							}}
							onDrop={event => {
								event.preventDefault();
								const orderId = event.dataTransfer.getData("text/plain") || draggedOrderId;
								setDragOverStatus(null);
								setDraggedOrderId(null);
								if (orderId) moveOrder(orderId, column.status);
							}}
						>
							<header className="flex items-center justify-between gap-2 px-4 py-3">
								<OrderStatusBadge status={column.status} />
								<span className="rounded-md bg-background px-2 py-1 font-semibold text-foreground text-sm shadow-sm">
									{column.orders.length}
								</span>
							</header>
							<div className="space-y-3 px-3 pb-3">
								{column.orders.length === 0 ? (
									<p className="rounded-md border border-dashed border-border px-2 py-8 text-center text-muted-foreground text-xs">
										{t("admin.orders.kanban.emptyColumn")}
									</p>
								) : (
									column.orders.map(order => (
										<OrderKanbanCard key={order.id} onDragStart={setDraggedOrderId} order={order} />
									))
								)}
							</div>
						</section>
					);
				})}
			</div>
		</div>
	);
}
