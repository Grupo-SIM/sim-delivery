import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getDeliveriesQueryKey, usePostDeliveries, useGetStaff } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { showAlert } from "@/stores";
import { useQueryClient } from "@tanstack/react-query";

interface AssignCourierModalProps {
	isOpen: boolean;
	onClose: () => void;
	orderId: string;
}

export function AssignCourierModal({ isOpen, onClose, orderId }: AssignCourierModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const assign = usePostDeliveries();
	const { data: staff } = useGetStaff();

	const [courierId, setCourierId] = useState("");

	const couriers = (staff ?? []).filter(s => s.role === "courier");
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
					handleClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={isOpen} maxWidth="420px" onClose={handleClose} title={t("admin.deliveries.assign.title")}>
			<div className="space-y-4">
				{couriers.length === 0 ? (
					<p className="text-sm text-muted-foreground">{t("admin.deliveries.assign.noCouriers")}</p>
				) : (
					<>
						<p className="mb-1 text-sm font-medium">{t("admin.deliveries.assign.courier")}</p>
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
						disabled={!courierId || assign.isPending || couriers.length === 0}
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
