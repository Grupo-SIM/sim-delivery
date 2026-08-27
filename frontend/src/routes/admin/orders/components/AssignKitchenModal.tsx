import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getOrdersQueryKey, useGetStaff, usePatchOrdersByOrderIdStatus } from "@/lib/api";
import { showAlert } from "@/stores";

interface AssignKitchenModalProps {
	currentAssigneeId: string | null;
	isOpen: boolean;
	onClose: () => void;
	orderId: string;
	status: "recebido" | "em_preparo" | "pronto" | "retirado" | "cancelado";
}

export function AssignKitchenModal({
	currentAssigneeId,
	isOpen,
	onClose,
	orderId,
	status,
}: AssignKitchenModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const assign = usePatchOrdersByOrderIdStatus();
	const { data: staff, isPending } = useGetStaff({ query: { enabled: isOpen } });
	const [preparedById, setPreparedById] = useState(currentAssigneeId ?? "");
	const kitchenOptions = (staff ?? [])
		.filter(member => member.role === "kitchen")
		.map(member => ({ label: member.name, value: member.id }));

	function handleClose() {
		setPreparedById(currentAssigneeId ?? "");
		onClose();
	}

	function submit() {
		assign.mutate(
			{ data: { preparedById: preparedById || null, status }, orderId },
			{
				onError: () => void showAlert(t("admin.orders.assignment.error")),
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
			maxWidth="420px"
			onClose={handleClose}
			title={t("admin.orders.assignment.kitchenTitle")}
			urlKey="order-kitchen-assign"
		>
			<div className="space-y-4">
				{isPending ? (
					<Skeleton className="h-10 w-full" />
				) : kitchenOptions.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("admin.orders.assignment.noKitchen")}</p>
				) : (
					<>
						<p className="font-medium text-sm">{t("admin.orders.assignment.preparedBy")}</p>
						<CustomSelect
							className="w-full"
							onChange={setPreparedById}
							options={kitchenOptions}
							value={preparedById}
						/>
					</>
				)}
				<div className="flex justify-end gap-2 pt-2">
					<Button onClick={handleClose} type="button" variant="outline">
						{t("admin.deliveries.assign.cancel")}
					</Button>
					<Button
						disabled={isPending || assign.isPending || kitchenOptions.length === 0}
						onClick={submit}
						type="button"
					>
						{assign.isPending ? t("admin.orders.assignment.saving") : t("admin.orders.assignment.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
