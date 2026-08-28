import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import {
	getDeliveriesQueryKey,
	getOrdersQueryKey,
	useGetDeliveries,
	useGetStaffCouriers,
	usePostDeliveries,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

const BUSY_DELIVERY_STATUSES = new Set(["atribuida", "pendente", "aceita", "a_caminho"]);

interface AssignCourierModalProps {
	currentCourierId?: string | null;
	isOpen: boolean;
	onAssigned?: () => void;
	onClose: () => void;
	orderId: string;
}

export function AssignCourierModal({ currentCourierId, isOpen, onAssigned, onClose, orderId }: AssignCourierModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const assign = usePostDeliveries();
	const { data: deliveries, isPending: deliveriesPending } = useGetDeliveries(undefined, {
		query: { enabled: isOpen },
	});
	const { data: couriers, isPending: couriersPending } = useGetStaffCouriers({
		query: { enabled: isOpen },
	});

	const [courierId, setCourierId] = useState("");
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (isOpen) setCourierId(currentCourierId ?? "");
	}, [currentCourierId, isOpen]);

	const busyCourierIds = new Set(
		(deliveries ?? [])
			.filter(delivery => BUSY_DELIVERY_STATUSES.has(delivery.status))
			.map(delivery => delivery.courierId),
	);
	const availableCouriers = (couriers ?? []).filter(
		courier =>
			(!busyCourierIds.has(courier.id) || courier.id === currentCourierId) &&
			courier.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")),
	);
	const courierOptions = availableCouriers.map(courier => ({ label: courier.name, value: courier.id }));

	function handleClose() {
		setCourierId("");
		setSearch("");
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
					showToast(t("admin.deliveries.assign.assigned"), "positive");
					handleClose();
					onAssigned?.();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="420px"
			onClose={handleClose}
			title={t("admin.deliveries.assign.title")}
			urlKey="order-courier-assign"
			urlState={orderId ?? undefined}
		>
			<div className="space-y-4">
				{deliveriesPending || couriersPending ? (
					<Skeleton className="h-10 w-full" />
				) : (
					<>
						<TextField
							label="Buscar entregador"
							onValueChange={setSearch}
							placeholder="Ex: Maria Silva"
							value={search}
						/>
						{availableCouriers.length === 0 ? (
							<p className="text-muted-foreground text-sm">{t("admin.deliveries.assign.noAvailableCouriers")}</p>
						) : (
							<>
								<p className="font-medium text-sm">{t("admin.deliveries.assign.courier")}</p>
								<CustomSelect
									className="w-full"
									onChange={setCourierId}
									options={courierOptions}
									value={courierId}
								/>
							</>
						)}
					</>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button onClick={handleClose} type="button" variant="outline">
						{t("admin.deliveries.assign.cancel")}
					</Button>
					<Button
						disabled={
							!courierId ||
							assign.isPending ||
							deliveriesPending ||
							couriersPending ||
							availableCouriers.length === 0
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
