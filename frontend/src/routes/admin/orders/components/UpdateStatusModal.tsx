import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { getOrdersQueryKey, usePatchOrdersByOrderIdStatus } from "@/lib/api";
import { showAlert } from "@/stores";

type NextStatus = "em_preparo" | "pronto" | "saiu_para_entrega" | "entregue" | "retirado" | "cancelado";

const TRANSITIONS: Record<string, NextStatus[]> = {
	em_preparo: ["pronto", "cancelado"],
	pronto: ["saiu_para_entrega", "retirado", "cancelado"],
	recebido: ["em_preparo", "cancelado"],
	saiu_para_entrega: ["entregue", "cancelado"],
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
				onError: () => void showAlert(t("admin.orders.updateStatus.error")),
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
			maxWidth="480px"
			onClose={handleClose}
			title={t("admin.orders.updateStatus.title")}
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{nexts.map(s => (
						<Button
							key={s}
							onClick={() => setSelected(s)}
							size="sm"
							type="button"
							variant={selected === s ? "default" : "outline"}
						>
							{t(`admin.orders.updateStatus.next.${s}`, { defaultValue: s })}
						</Button>
					))}
				</div>

				{selected === "cancelado" && (
					<TextField
						label={t("admin.orders.updateStatus.cancelReason")}
						onValueChange={setCancelReason}
						placeholder={t("admin.orders.updateStatus.cancelReasonPlaceholder")}
						value={cancelReason}
					/>
				)}

				<div className="flex justify-end gap-2 pt-2">
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
