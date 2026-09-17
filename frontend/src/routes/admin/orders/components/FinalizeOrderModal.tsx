import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleCheck, LuCircleX, LuPackageCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { type FinalizedStatus, IntentOption } from "./FinalizeOrderModal/index";

interface FinalizeOrderModalProps {
	deliveryMethod: string;
	isOpen: boolean;
	isPending: boolean;
	onClose: () => void;
	onConfirm: (status: FinalizedStatus, cancelReason?: string) => void;
	orderId?: string;
}

export function FinalizeOrderModal({
	deliveryMethod,
	isOpen,
	isPending,
	onClose,
	onConfirm,
	orderId,
}: FinalizeOrderModalProps) {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<FinalizedStatus | null>(null);
	const [cancelReason, setCancelReason] = useState("");
	const completionStatus = deliveryMethod === "pickup" ? "retirado" : "entregue";
	const completionIcon = deliveryMethod === "pickup" ? LuPackageCheck : LuCircleCheck;
	const completionLabel = t(`admin.orders.status.${completionStatus}`);
	const completionDescription = t(`admin.orders.kanban.finalize.options.${completionStatus}.description`);

	function handleClose() {
		setSelected(null);
		setCancelReason("");
		onClose();
	}

	function handleConfirm() {
		if (!selected) return;
		onConfirm(selected, selected === "cancelado" ? cancelReason.trim() || undefined : undefined);
	}

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="520px"
			onClose={handleClose}
			title={t("admin.orders.kanban.finalize.title")}
			urlKey="order-finalize"
			urlState={orderId && selected ? `${orderId}:${selected}` : orderId}
		>
			<div className="space-y-6">
				<p className="text-muted-foreground text-sm leading-6">
					{t("admin.orders.kanban.finalize.description")}
				</p>

				<div className="grid gap-3">
					<IntentOption
						description={completionDescription}
						icon={completionIcon}
						isSelected={selected === completionStatus}
						label={completionLabel}
						onClick={() => setSelected(completionStatus)}
					/>
					<IntentOption
						description={t("admin.orders.kanban.finalize.options.cancelado.description")}
						icon={LuCircleX}
						isSelected={selected === "cancelado"}
						label={t("admin.orders.status.cancelado")}
						onClick={() => setSelected("cancelado")}
						variant="destructive"
					/>
				</div>

				{selected === "cancelado" && (
					<TextField
						label={t("admin.orders.updateStatus.cancelReason")}
						name="cancelReason"
						onValueChange={setCancelReason}
						placeholder={t("admin.orders.updateStatus.cancelReasonPlaceholder")}
						value={cancelReason}
					/>
				)}

				<div className="flex flex-col-reverse gap-2 border-border/70 border-t pt-5 sm:flex-row sm:justify-end">
					<Button onClick={() => window.history.back()} type="button" variant="outline">
						{t("admin.orders.updateStatus.cancel")}
					</Button>
					<Button
						disabled={!selected || isPending}
						onClick={handleConfirm}
						type="button"
						variant={selected === "cancelado" ? "destructive" : "default"}
					>
						{isPending
							? t("admin.orders.updateStatus.saving")
							: t("admin.orders.kanban.finalize.confirm")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
