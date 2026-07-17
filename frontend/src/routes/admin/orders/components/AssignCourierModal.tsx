import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getDeliveriesQueryKey,
	getOrdersQueryKey,
	useGetDeliveries,
	useGetStaff,
	usePostDeliveries,
} from "@/lib/api";
import { showAlert } from "@/stores";

const BUSY_DELIVERY_STATUSES = new Set(["atribuida", "pendente", "aceita", "a_caminho"]);

interface AssignCourierModalProps {
	isOpen: boolean;
	onClose: () => void;
	orderId: string;
}

export function AssignCourierModal({ isOpen, onClose, orderId }: AssignCourierModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const assign = usePostDeliveries();
	const { data: deliveries, isPending: deliveriesPending } = useGetDeliveries(undefined, {
		query: { enabled: isOpen },
	});
	const { data: staff, isPending: staffPending } = useGetStaff();

	const [courierId, setCourierId] = useState("");

	const busyCourierIds = new Set(
		(deliveries ?? [])
			.filter(delivery => BUSY_DELIVERY_STATUSES.has(delivery.status))
			.map(delivery => delivery.courierId),
	);
	const couriers = (staff ?? []).filter(s => s.role === "courier" && !busyCourierIds.has(s.id));
	const courierOptions = couriers.map(c => ({ label: c.name, value: c.id }));

	function handleClose() {
		setCourierId("");
		onClose();
	}

	function submit() {
		if (!courierId) return;

		assign.mutate(
			{ data: { courierId, orderId } },
			{
				onError: () => void showAlert(t("admin.deliveries.assign.error")),
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: getDeliveriesQueryKey() });
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
					handleClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={isOpen} maxWidth="420px" onClose={handleClose} title={t("admin.deliveries.assign.title")}>
			<div className="space-y-4">
				{deliveriesPending || staffPending ? (
					<Skeleton className="h-10 w-full" />
				) : couriers.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("admin.deliveries.assign.noAvailableCouriers")}</p>
				) : (
					<>
						<p className="mb-1 font-medium text-sm">{t("admin.deliveries.assign.courier")}</p>
						<CustomSelect
							className="w-full"
							onChange={setCourierId}
							options={courierOptions}
							value={courierId}
						/>
					</>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button onClick={handleClose} type="button" variant="outline">
						{t("admin.deliveries.assign.cancel")}
					</Button>
					<Button
						disabled={
							!courierId || assign.isPending || deliveriesPending || staffPending || couriers.length === 0
						}
						onClick={submit}
						type="button"
					>
						{assign.isPending ? t("admin.deliveries.assign.saving") : t("admin.deliveries.assign.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
