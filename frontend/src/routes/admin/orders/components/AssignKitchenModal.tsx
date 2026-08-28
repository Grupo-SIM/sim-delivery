import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { getOrdersQueryKey, useGetStaff, usePatchOrdersByOrderIdStatus } from "@/lib/api";
import { showAlert, showToast } from "@/stores";

const REMOVE_ASSIGNMENT_VALUE = "__remove_assignment__";

interface AssignKitchenModalProps {
	currentAssigneeId: string | null;
	currentAssigneeName: string | null;
	isOpen: boolean;
	onClose: () => void;
	orderId: string;
	status: "recebido" | "em_preparo";
}

export function AssignKitchenModal({
	currentAssigneeId,
	currentAssigneeName,
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
	if (currentAssigneeId) {
		if (!kitchenOptions.some(option => option.value === currentAssigneeId) && currentAssigneeName) {
			kitchenOptions.unshift({ label: currentAssigneeName, value: currentAssigneeId });
		}
		kitchenOptions.unshift({ label: t("admin.orders.assignment.remove"), value: REMOVE_ASSIGNMENT_VALUE });
	}

	function handleClose() {
		setPreparedById(currentAssigneeId ?? "");
		onClose();
	}

	function submit() {
		assign.mutate(
			{
				data: {
					preparedById: preparedById === REMOVE_ASSIGNMENT_VALUE ? null : preparedById || null,
					status,
				},
				orderId,
			},
			{
				onError: () => void showAlert(t("admin.orders.assignment.error")),
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					showToast(
						t(
							preparedById === REMOVE_ASSIGNMENT_VALUE
								? "admin.orders.assignment.removed"
								: "admin.orders.assignment.saved",
						),
						"positive",
					);
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
				{!isPending && kitchenOptions.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("admin.orders.assignment.noKitchen")}</p>
				) : (
					<>
						<p className="font-medium text-sm">{t("admin.orders.assignment.preparedBy")}</p>
						<CustomSelect
							className="w-full"
							disabled={isPending}
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
