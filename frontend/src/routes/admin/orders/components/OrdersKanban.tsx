import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuCircleAlert } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetOrders200,
	getOrdersQueryKey,
	type PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey,
	usePatchOrdersByOrderIdStatus,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { OrderKanbanCard } from "./OrderKanbanCard";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { PhaseEstimateModal } from "./PhaseEstimateModal";

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
type EstimableStatus = "em_preparo";
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

function isFinalizedStatus(status: KanbanStatus): status is FinalizedStatus {
	return FINALIZED_STATUSES.includes(status as FinalizedStatus);
}

function getFinalizedStatus(): FinalizedStatus {
	return "entregue";
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
	const [problemOrderId, setProblemOrderId] = useState<string | null>(null);
	const [phaseEstimate, setPhaseEstimate] = useState<{
		orderId: string;
		status: EstimableStatus;
	} | null>(null);
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
		if (!isMovableStatus(status)) {
			return t("admin.orders.updateStatus.errors.cannotReturnToPayment", {
				defaultValue:
					"Não é possível voltar um pedido para Aguardando pagamento pelo kanban. Esse status é controlado pelo pagamento.",
			});
		}
		if (status === "problema") return null;
		if (status === "cancelado") return null;

		return null;
	}

	function moveOrder(orderId: string, status: KanbanStatus) {
		const order = orders.find(candidate => candidate.id === orderId);
		if (!order) return;
		if (order.status === status) return;
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
		if (status === "em_preparo") {
			setPhaseEstimate({ orderId, status });
			return;
		}

		updateOrderStatus(orderId, status);
	}

	function updateOrderStatus(
		orderId: string,
		status: PatchOrdersByOrderIdStatusMutationRequestStatusEnumKey,
		estimatedMinutes?: number,
		closeEstimateModal = false,
	) {
		patchStatus.mutate(
			{ data: { estimatedMinutes, status }, orderId },
			{
				onError: () =>
					void showAlert(
						t("admin.orders.updateStatus.errors.generic", {
							defaultValue: "Não foi possível atualizar o status agora. Atualize a página e tente novamente.",
						}),
						t("admin.orders.updateStatus.errorTitle", { defaultValue: "Falha ao atualizar" }),
					),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					if (closeEstimateModal) {
						showToast(
							estimatedMinutes === undefined
								? "Status atualizado sem estimativa."
								: "Status atualizado com estimativa da fase.",
							"positive",
						);
						window.history.back();
					}
				},
			},
		);
	}

	function confirmProblem() {
		if (!problemOrderId || !problemReason.trim()) return;
		patchStatus.mutate(
			{ data: { problemReason: problemReason.trim(), status: "problema" }, orderId: problemOrderId },
			{
				onError: () =>
					void showAlert(
						"Não foi possível registrar a pendência agora. Atualize a página e tente novamente.",
						"Falha ao registrar pendência",
					),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					showToast("Pendência registrada no pedido.", "positive");
					setProblemReason("");
					window.history.back();
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
				className="h-[calc(100dvh-14rem)] overflow-auto pb-3"
				onDragLeave={event => {
					const nextTarget = event.relatedTarget as Node | null;
					if (nextTarget && !event.currentTarget.contains(nextTarget)) finishDrag();
				}}
				onDragOver={event => updateAutoScroll(event.clientX)}
				ref={scrollContainerRef}
			>
				<div
					className="grid min-h-full gap-3"
					style={{
						gridTemplateColumns: `repeat(${columns.length}, minmax(15rem, 1fr))`,
						minWidth: `${columns.length * 15}rem`,
					}}
				>
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
								className={`rounded-2xl border bg-muted/35 transition ${
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
										column.kind === "finalized" ? getFinalizedStatus() : column.status,
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
												canDrag
												canManageCourierAssignment={role !== "kitchen" && role !== "courier"}
												canManageKitchenAssignment={role !== "courier"}
												canPrint={[
													"superAdmin",
													"owner",
													"manager",
													"attendant",
													"kitchen",
												].includes(role ?? "")}
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
				onClose={() => {
					setProblemOrderId(null);
					setProblemReason("");
				}}
				title={
					<span className="flex items-center gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
							<LuCircleAlert className="size-5" />
						</span>
						<span>Registrar pendência</span>
					</span>
				}
				urlKey="order-problem-create"
				urlState={problemOrderId ?? undefined}
			>
				<div className="space-y-6">
					<p className="text-muted-foreground text-sm leading-6">
						Descreva o ocorrido para orientar a equipe no próximo atendimento deste pedido.
					</p>
					<Label>
						<span>
							O que aconteceu <RequiredMark />
						</span>
						<Input
							autoComplete="off"
							name="problemReason"
							onChange={event => setProblemReason(event.currentTarget.value)}
							placeholder="Ex.: Item faltante será enviado novamente."
							type="text"
							value={problemReason}
						/>
					</Label>
					<div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
						<Button onClick={() => window.history.back()} type="button" variant="outline">
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
			<PhaseEstimateModal
				isOpen={phaseEstimate !== null}
				isPending={patchStatus.isPending}
				key={phaseEstimate ? `${phaseEstimate.orderId}:${phaseEstimate.status}` : "closed"}
				onClose={() => setPhaseEstimate(null)}
				onConfirm={minutes => {
					if (phaseEstimate)
						updateOrderStatus(phaseEstimate.orderId, phaseEstimate.status, minutes, true);
				}}
				orderId={phaseEstimate?.orderId}
				status={phaseEstimate?.status ?? "em_preparo"}
			/>
		</>
	);
}
