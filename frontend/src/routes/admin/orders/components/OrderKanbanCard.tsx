import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuBike, LuChefHat, LuCircleAlert, LuShoppingBag } from "react-icons/lu";
import { OrderSummaryModal } from "@/components/orders";
import { Button } from "@/components/ui/button";
import { getOrdersQueryKey, type GetOrders200, usePatchOrdersByOrderIdStatus } from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { AssignCourierModal } from "./AssignCourierModal";
import { AssignKitchenModal } from "./AssignKitchenModal";
import { OrderReceiptButton } from "./OrderReceiptButton";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { PhaseEstimateModal } from "./PhaseEstimateModal";

interface OrderKanbanCardProps {
	canManageCourierAssignment: boolean;
	canManageKitchenAssignment: boolean;
	canPrint: boolean;
	canDrag: boolean;
	onDragEnd: () => void;
	onDragStart: (orderId: string) => void;
	order: GetOrders200[number];
	showStatus?: boolean;
}

export function OrderKanbanCard({
	canDrag,
	canManageCourierAssignment,
	canManageKitchenAssignment,
	canPrint,
	onDragEnd,
	onDragStart,
	order,
	showStatus = false,
}: OrderKanbanCardProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patchStatus = usePatchOrdersByOrderIdStatus();
	const [assignOpen, setAssignOpen] = useState(false);
	const [assignKitchenOpen, setAssignKitchenOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [estimateOpen, setEstimateOpen] = useState(false);

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
	const canEditEstimate = order.status === "em_preparo";
	const problemReason = order.status === "problema" ? order.problemReason : null;
	const initialEstimateMinutes = order.estimatedStatusCompletionAt
		? Math.max(1, Math.round((new Date(order.estimatedStatusCompletionAt).getTime() - Date.now()) / 60_000))
		: 15;

	function updateEstimate(minutes?: number) {
		if (order.status !== "em_preparo") return;

		patchStatus.mutate(
			{ data: { estimatedMinutes: minutes, status: order.status }, orderId: order.id },
			{
				onError: () =>
					void showAlert("Não foi possível atualizar a previsão agora. Atualize a página e tente novamente."),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					showToast(minutes === undefined ? "Previsão removida." : "Previsão atualizada.", "positive");
					window.history.back();
				},
			},
		);
	}

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
						<p className="mt-1 font-semibold text-primary text-sm">#{order.displayNumber}</p>
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
				{problemReason && (
					<div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-left text-sm">
						<p className="flex items-center gap-1.5 font-semibold text-destructive">
							<LuCircleAlert aria-hidden className="size-4 shrink-0" />
							{t("admin.orders.problemReason")}
						</p>
						<p className="mt-1 break-words text-foreground leading-5">{problemReason}</p>
					</div>
				)}
			</button>

			{(canManageKitchenAssignment || canManageCourierAssignment) && (canAssignCourier || canAssignKitchen) && (
				<div className="mt-4 flex flex-wrap gap-2 border-border border-t pt-3">
					{canManageKitchenAssignment && canAssignKitchen && (
						<Button onClick={() => setAssignKitchenOpen(true)} size="sm" type="button" variant="outline">
							<LuChefHat aria-hidden className="size-4" />
							<span className="max-w-32 truncate">
								{order.preparedBy?.name ?? t("admin.orders.assignment.assign")}
							</span>
						</Button>
					)}
					{canManageCourierAssignment && canAssignCourier && (
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
				onEditEstimate={canEditEstimate ? () => setEstimateOpen(true) : undefined}
				onClose={() => setDetailsOpen(false)}
				order={detailsOpen ? order : null}
				view="orders"
			/>
			<PhaseEstimateModal
				initialMinutes={initialEstimateMinutes}
				isOpen={estimateOpen}
				isPending={patchStatus.isPending}
				key={estimateOpen ? `${order.id}:${order.status}` : "closed"}
				onClose={() => setEstimateOpen(false)}
				onConfirm={updateEstimate}
				orderId={order.id}
				status="em_preparo"
			/>
		</article>
	);
}
