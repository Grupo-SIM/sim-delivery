import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { getOrdersQueryKey, usePatchOrdersByOrderIdStatus } from "@/lib/api";
import { showAlert } from "@/stores";
import { OrderStatusBadge } from "./OrderStatusBadge";

type NextStatus = "recebido" | "em_preparo" | "pronto" | "saiu_para_entrega" | "entregue" | "retirado" | "cancelado";

const TRANSITIONS: Record<string, NextStatus[]> = {
	cancelado: ["recebido", "em_preparo", "pronto"],
	em_preparo: ["recebido", "pronto", "cancelado"],
	entregue: ["saiu_para_entrega"],
	pronto: ["em_preparo", "saiu_para_entrega", "retirado", "cancelado"],
	recebido: ["em_preparo", "cancelado"],
	retirado: ["pronto"],
	saiu_para_entrega: ["pronto", "entregue", "cancelado"],
};

interface UpdateStatusModalProps {
	currentStatus: string;
	deliveryMethod: string;
	hasDeliveryAssigned?: boolean;
	isOpen: boolean;
	onClose: () => void;
	orderId: string;
}

export function UpdateStatusModal({
	currentStatus,
	deliveryMethod,
	hasDeliveryAssigned = false,
	isOpen,
	onClose,
	orderId,
}: UpdateStatusModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchOrdersByOrderIdStatus();

	const [selected, setSelected] = useState<NextStatus | null>(null);
	const [cancelReason, setCancelReason] = useState("");

	const nexts = (TRANSITIONS[currentStatus] ?? []).filter(s => {
		if (s === "saiu_para_entrega" && (deliveryMethod !== "delivery" || !hasDeliveryAssigned)) return false;
		if (s === "retirado" && deliveryMethod !== "pickup") return false;
		return true;
	});
	const hasOptions = nexts.length > 0;

	function handleClose() {
		setSelected(null);
		setCancelReason("");
		onClose();
	}

	function submit() {
		if (!selected) return;

		patch.mutate(
			{
				data: {
					cancelReason: selected === "cancelado" ? cancelReason : undefined,
					status: selected,
				},
				orderId,
			},
			{
				onError: () =>
					void showAlert(
						t("admin.orders.updateStatus.errors.generic", {
							defaultValue: "Não foi possível atualizar o status agora. Atualize a página e tente novamente.",
						}),
						t("admin.orders.updateStatus.errorTitle", { defaultValue: "Falha ao atualizar" }),
					),
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					handleClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="520px"
			onClose={handleClose}
			title={t("admin.orders.updateStatus.title")}
		>
			<div className="space-y-5">
				<div className="rounded-lg border border-border bg-muted/35 p-4">
					<p className="font-medium text-muted-foreground text-sm">
						{t("admin.orders.updateStatus.current", { defaultValue: "Status atual" })}
					</p>
					<div className="mt-2 flex items-center justify-between gap-3">
						<OrderStatusBadge status={currentStatus} />
						<span className="text-muted-foreground text-xs">
							{deliveryMethod === "delivery"
								? t("admin.orders.updateStatus.deliveryOrder", { defaultValue: "Pedido delivery" })
								: t("admin.orders.updateStatus.pickupOrder", { defaultValue: "Pedido retirada" })}
						</span>
					</div>
				</div>

				<div>
					<p className="font-semibold text-foreground text-sm">
						{t("admin.orders.updateStatus.chooseNext", { defaultValue: "Escolha para onde mover" })}
					</p>
					<p className="mt-1 text-muted-foreground text-sm leading-5">
						{t("admin.orders.updateStatus.help", {
							defaultValue:
								"Você pode avançar ou voltar uma etapa por vez. Pedidos aguardando pagamento entram no fluxo automaticamente quando o pagamento é confirmado.",
						})}
					</p>
				</div>

				{hasOptions ? (
					<div className="grid gap-2 sm:grid-cols-2">
						{nexts.map(s => (
							<Button
								className="justify-start"
								key={s}
								onClick={() => setSelected(s)}
								type="button"
								variant={selected === s ? "default" : "outline"}
							>
								{t(`admin.orders.updateStatus.next.${s}`, { defaultValue: s })}
							</Button>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 text-sm leading-5">
						{currentStatus === "awaiting_payment"
							? t("admin.orders.updateStatus.noOptions.awaitingPayment", {
									defaultValue:
										"Este pedido ainda depende da confirmação de pagamento. Assim que o pagamento for confirmado, ele passa para Recebido e poderá seguir no kanban.",
								})
							: t("admin.orders.updateStatus.noOptions.default", {
									defaultValue: "Não há uma alteração manual disponível para este status.",
								})}
					</div>
				)}

				{selected === "cancelado" && (
					<TextField
						label={t("admin.orders.updateStatus.cancelReason")}
						onValueChange={setCancelReason}
						placeholder={t("admin.orders.updateStatus.cancelReasonPlaceholder")}
						value={cancelReason}
					/>
				)}

				<div className="flex justify-end gap-2 border-border border-t pt-4">
					<Button onClick={handleClose} type="button" variant="outline">
						{t("admin.orders.updateStatus.cancel")}
					</Button>
					<Button
						disabled={!selected || patch.isPending || (selected === "cancelado" && !cancelReason.trim())}
						onClick={submit}
						type="button"
					>
						{patch.isPending ? t("admin.orders.updateStatus.saving") : t("admin.orders.updateStatus.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
