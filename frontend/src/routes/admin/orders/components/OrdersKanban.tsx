import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetOrders200,
	getOrdersQueryKey,
	type PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey,
	usePatchOrdersByOrderIdStatus,
} from "@/lib/api";
import { showAlert } from "@/stores";
import { OrderKanbanCard } from "./OrderKanbanCard";
import { AssignCourierModal } from "./AssignCourierModal";
import { OrderStatusBadge } from "./OrderStatusBadge";

const KANBAN_STATUSES = [
	"awaiting_payment",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"problema",
	"entregue",
	"retirado",
	"cancelado",
] as const;

const FINALIZED_STATUSES = ["entregue", "retirado", "cancelado"] as const;

type KanbanStatus = (typeof KANBAN_STATUSES)[number];
type FinalizedStatus = (typeof FINALIZED_STATUSES)[number];
type KanbanColumn =
	| { kind: "status"; orders: GetOrders200; status: KanbanStatus }
	| { kind: "finalized"; orders: GetOrders200; status: "finalizado" };

const MOVABLE_STATUSES: readonly PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey[] = [
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"problema",
	"entregue",
	"retirado",
	"cancelado",
];

const AUTO_SCROLL_EDGE_PX = 120;
const AUTO_SCROLL_MAX_SPEED = 22;

function isMovableStatus(
	status: KanbanStatus,
): status is PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey {
	return MOVABLE_STATUSES.includes(status as PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey);
}

function getFlow(deliveryMethod: string) {
	return deliveryMethod === "pickup"
		? ["recebido", "em_preparo", "pronto", "retirado"]
		: ["recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue"];
}

function isFinalizedStatus(status: KanbanStatus): status is FinalizedStatus {
	return FINALIZED_STATUSES.includes(status as FinalizedStatus);
}

function getFinalizedStatus(order: GetOrders200[number]): FinalizedStatus {
	return order.deliveryMethod === "pickup" ? "retirado" : "entregue";
}

interface OrdersKanbanProps {
	orders: GetOrders200;
	role: string | null;
	statuses: readonly KanbanStatus[];
}

export function OrdersKanban({ orders, role, statuses }: OrdersKanbanProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patchStatus = usePatchOrdersByOrderIdStatus();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const scrollFrameRef = useRef<number | null>(null);
	const scrollSpeedRef = useRef(0);
	const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
	const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
	const [courierAssignmentOrderId, setCourierAssignmentOrderId] = useState<string | null>(null);
	const [problemOrderId, setProblemOrderId] = useState<string | null>(null);
	const [problemReason, setProblemReason] = useDebouncedInput("", () => undefined);
	const columns = useMemo<KanbanColumn[]>(
		() => {
			const regularColumns = statuses
				.filter(status => !isFinalizedStatus(status))
				.map(status => ({
					kind: "status" as const,
					orders: orders.filter(order => order.status === status),
					status,
				}));
			const canShowFinalized = statuses.some(isFinalizedStatus);
			if (!canShowFinalized) return regularColumns;

			return [
				...regularColumns,
				{
					kind: "finalized" as const,
					orders: orders.filter(order => FINALIZED_STATUSES.includes(order.status as FinalizedStatus)),
					status: "finalizado" as const,
				},
			];
		},
		[orders, statuses],
	);

	const stopAutoScroll = useCallback(() => {
		scrollSpeedRef.current = 0;
		if (scrollFrameRef.current === null) return;
		window.cancelAnimationFrame(scrollFrameRef.current);
		scrollFrameRef.current = null;
	}, []);

	useEffect(() => stopAutoScroll, [stopAutoScroll]);

	function runAutoScroll() {
		const container = scrollContainerRef.current;
		const speed = scrollSpeedRef.current;

		if (!container || speed === 0) {
			scrollFrameRef.current = null;
			return;
		}

		container.scrollLeft += speed;
		scrollFrameRef.current = window.requestAnimationFrame(runAutoScroll);
	}

	function updateAutoScroll(clientX: number) {
		const container = scrollContainerRef.current;
		if (!container) return;

		const rect = container.getBoundingClientRect();
		const distanceFromLeft = clientX - rect.left;
		const distanceFromRight = rect.right - clientX;
		let nextSpeed = 0;

		if (distanceFromLeft < AUTO_SCROLL_EDGE_PX) {
			nextSpeed = -Math.ceil(
				((AUTO_SCROLL_EDGE_PX - distanceFromLeft) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_SPEED,
			);
		} else if (distanceFromRight < AUTO_SCROLL_EDGE_PX) {
			nextSpeed = Math.ceil(
				((AUTO_SCROLL_EDGE_PX - distanceFromRight) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_SPEED,
			);
		}

		scrollSpeedRef.current = nextSpeed;
		if (nextSpeed !== 0 && scrollFrameRef.current === null) {
			scrollFrameRef.current = window.requestAnimationFrame(runAutoScroll);
		}
	}

	function finishDrag() {
		stopAutoScroll();
		setDragOverStatus(null);
		setDraggedOrderId(null);
	}

	function showStatusAlert(message: string) {
		void showAlert(
			message,
			t("admin.orders.updateStatus.blockedTitle", { defaultValue: "Status não alterado" }),
		);
	}

	function getMoveBlockReason(order: GetOrders200[number], status: KanbanStatus) {
		if (order.status === status) return null;
		if (
			role === "kitchen" &&
			!(
				(order.status === "recebido" && status === "em_preparo") ||
				(order.status === "em_preparo" && status === "pronto")
			)
		) {
			return "Você só pode avançar pedidos de Recebido para Em preparo ou de Em preparo para Pronto.";
		}
		if (
			role === "courier" &&
			!(
				(order.status === "pronto" && status === "saiu_para_entrega") ||
				(order.status === "saiu_para_entrega" && status === "entregue")
			)
		) {
			return "Você só pode avançar pedidos de Pronto para Saiu para entrega ou de Saiu para entrega para Entregue.";
		}
		if (order.status === "awaiting_payment") {
			return t("admin.orders.updateStatus.errors.awaitingPayment", {
				defaultValue:
					"Este pedido ainda está aguardando pagamento. Ele só pode ir para preparo depois que o pagamento for confirmado e o status virar Recebido.",
			});
		}
		if (!isMovableStatus(status)) {
			return t("admin.orders.updateStatus.errors.cannotReturnToPayment", {
				defaultValue:
					"Não é possível voltar um pedido para Aguardando pagamento pelo kanban. Esse status é controlado pelo pagamento.",
			});
		}
		if (status === "saiu_para_entrega" && order.deliveryMethod !== "delivery") {
			return t("admin.orders.updateStatus.errors.deliveryOnly", {
				defaultValue:
					"Somente pedidos de entrega podem sair para entrega. Pedidos de retirada devem ir para Retirado.",
			});
		}
		if (status === "saiu_para_entrega" && !order.delivery && role !== "courier") {
			return t("admin.orders.updateStatus.errors.needsCourier", {
				defaultValue: "Antes de sair para entrega, atribua um entregador disponível ao pedido.",
			});
		}
		if (status === "retirado" && order.deliveryMethod !== "pickup") {
			return t("admin.orders.updateStatus.errors.pickupOnly", {
				defaultValue:
					"Somente pedidos de retirada podem ser marcados como Retirado. Para delivery, use Saiu para entrega e depois Entregue.",
			});
		}
		if (order.status === "cancelado" && !["recebido", "em_preparo", "pronto"].includes(status)) {
			return t("admin.orders.updateStatus.errors.cancelledReopen", {
				defaultValue: "Pedidos cancelados só podem ser reabertos para Recebido, Em preparo ou Pronto.",
			});
		}
		if (status === "cancelado") return null;

		const flow = getFlow(order.deliveryMethod);
		const currentIndex = flow.indexOf(order.status);
		const nextIndex = flow.indexOf(status);
		if (currentIndex >= 0 && nextIndex >= 0 && Math.abs(nextIndex - currentIndex) === 1) return null;

		return t("admin.orders.updateStatus.errors.sequence", {
			defaultValue: "Esse movimento pula etapas do pedido. Avance ou volte apenas uma coluna por vez.",
		});
	}

	function moveOrder(orderId: string, status: KanbanStatus) {
		const order = orders.find(candidate => candidate.id === orderId);
		if (!order) return;
		if (order.status === "pronto" && status === "saiu_para_entrega" && !order.delivery && role !== "courier") {
			setCourierAssignmentOrderId(orderId);
			return;
		}

		const blockReason = getMoveBlockReason(order, status);
		if (blockReason) {
			showStatusAlert(blockReason);
			return;
		}
		if (!isMovableStatus(status)) return;
		if (status === "problema") {
			setProblemOrderId(orderId);
			return;
		}

		updateOrderStatus(orderId, status as PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey);
	}

	function updateOrderStatus(orderId: string, status: PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey) {
		patchStatus.mutate(
			{ data: { status }, orderId },
			{
				onError: () =>
					void showAlert(
						t("admin.orders.updateStatus.errors.generic", {
							defaultValue: "Não foi possível atualizar o status agora. Atualize a página e tente novamente.",
						}),
						t("admin.orders.updateStatus.errorTitle", { defaultValue: "Falha ao atualizar" }),
					),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() }),
			},
		);
	}

	function confirmProblem() {
		if (!problemOrderId || !problemReason.trim()) return;
		patchStatus.mutate(
			{ data: { problemReason: problemReason.trim(), status: "problema" }, orderId: problemOrderId },
			{
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					setProblemOrderId(null);
					setProblemReason("");
				},
			},
		);
	}

	if (orders.length === 0) {
		return <EmptyState title={t("admin.orders.empty")} />;
	}

	return (
		<>
			<ScrollArea
				className="-mx-5 overflow-x-auto px-5 pb-3"
				onDragLeave={event => {
					const nextTarget = event.relatedTarget as Node | null;
					if (nextTarget && !event.currentTarget.contains(nextTarget)) finishDrag();
				}}
				onDragOver={event => updateAutoScroll(event.clientX)}
				ref={scrollContainerRef}
			>
				<div className="flex min-w-max gap-3">
					{columns.map(column => {
						const isDropTarget = dragOverStatus === column.status;
						const finalizedCounts =
							column.kind === "finalized"
								? FINALIZED_STATUSES.map(status => ({
									count: column.orders.filter(order => order.status === status).length,
									status,
								}))
								: [];
						return (
							<section
								className={`min-h-[36rem] w-[280px] shrink-0 rounded-2xl border bg-muted/35 transition ${
									isDropTarget ? "border-primary bg-primary/5" : "border-border"
								}`}
								key={column.status}
								onDragLeave={event => {
									if (!event.currentTarget.contains(event.relatedTarget as Node | null))
										setDragOverStatus(null);
								}}
								onDragOver={event => {
									event.preventDefault();
									event.dataTransfer.dropEffect = "move";
									updateAutoScroll(event.clientX);
									setDragOverStatus(column.status);
								}}
								onDrop={event => {
									event.preventDefault();
									const orderId = event.dataTransfer.getData("text/plain") || draggedOrderId;
									finishDrag();
									const order = orders.find(candidate => candidate.id === orderId);
									if (order)
										moveOrder(
											order.id,
											column.kind === "finalized" ? getFinalizedStatus(order) : column.status,
										);
								}}
							>
								<header className="relative z-20 flex items-center justify-between gap-2 px-4 py-3">
									{column.kind === "finalized" ? (
										<div>
											<p className="font-semibold text-foreground text-sm">
												{t("admin.orders.kanban.finalized")}
											</p>
											<p className="text-muted-foreground text-xs">
												{finalizedCounts
													.filter(({ count }) => count > 0)
													.map(
														({ count, status }) => `${t(`admin.orders.status.${status}`)}: ${count}`,
													)
													.join(" · ") || t("admin.orders.kanban.emptyColumn")}
											</p>
										</div>
									) : (
										<OrderStatusBadge showHelp status={column.status} />
									)}
									<span className="rounded-md bg-background px-2 py-1 font-semibold text-foreground text-sm shadow-sm">
										{column.orders.length}
									</span>
								</header>
								<div className="space-y-3 px-3 pb-3">
									{column.orders.length === 0 ? (
										<p className="rounded-md border border-border border-dashed px-2 py-8 text-center text-muted-foreground text-xs">
											{t("admin.orders.kanban.emptyColumn")}
										</p>
									) : (
										column.orders.map(order => (
											<OrderKanbanCard
												canDrag={
													role !== "kitchen" && role !== "courier"
														? true
														: role === "kitchen"
															? order.status === "recebido" || order.status === "em_preparo"
															: order.status === "pronto" || order.status === "saiu_para_entrega"
												}
												canManageAssignments={role !== "kitchen" && role !== "courier"}
															key={order.id}
															onDragEnd={finishDrag}
															onDragStart={setDraggedOrderId}
															order={order}
															showStatus={column.kind === "finalized"}
											/>
										))
									)}
								</div>
							</section>
						);
					})}
				</div>
			</ScrollArea>
			<Modal
				isOpen={problemOrderId !== null}
				maxWidth="520px"
				onClose={() => setProblemOrderId(null)}
				title="Registrar pendência"
				urlKey="order-problem-create"
				urlState={problemOrderId ?? undefined}
			>
				<div className="space-y-4">
					<label className="space-y-1">
						<span className="font-medium text-sm">Explique o que aconteceu *</span>
						<Input
							onChange={event => setProblemReason(event.currentTarget.value)}
							placeholder="Ex: Item faltante será enviado novamente."
							type="text"
							value={problemReason}
						/>
					</label>
					<div className="flex justify-end gap-2">
						<Button onClick={() => setProblemOrderId(null)} type="button" variant="outline">
							Descartar
						</Button>
						<Button
							disabled={!problemReason.trim() || patchStatus.isPending}
							onClick={confirmProblem}
							type="button"
						>
							Salvar pendência
						</Button>
					</div>
				</div>
			</Modal>
			<AssignCourierModal
				isOpen={courierAssignmentOrderId !== null}
				onAssigned={() => {
					if (courierAssignmentOrderId) updateOrderStatus(courierAssignmentOrderId, "saiu_para_entrega");
				}}
				onClose={() => setCourierAssignmentOrderId(null)}
				orderId={courierAssignmentOrderId ?? ""}
			/>
		</>
	);
}
