import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, buttonClassName } from "@/components/ui/button";
import {
	type GetDeliveries200,
	getDeliveriesQueryKey,
	usePatchDeliveriesByDeliveryIdStatus,
} from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";

type Delivery = GetDeliveries200[number];

const NEXT_ACTIONS: Record<string, { status: string; labelKey: string; destructive?: boolean }[]> = {
	a_caminho: [
		{ labelKey: "courier.actions.markDelivered", status: "entregue" },
		{ destructive: true, labelKey: "courier.actions.markFailed", status: "falhou" },
	],
	aceita: [
		{ labelKey: "courier.actions.startRoute", status: "a_caminho" },
		{ destructive: true, labelKey: "courier.actions.refuse", status: "recusada" },
	],
	atribuida: [
		{ labelKey: "courier.actions.accept", status: "aceita" },
		{ destructive: true, labelKey: "courier.actions.refuse", status: "recusada" },
	],
};

function buildMapsUrl(addr: NonNullable<Delivery["order"]["address"]>): string {
	const parts = [addr.addressLine, addr.number, addr.neighborhood, addr.city, addr.state]
		.filter(Boolean)
		.join(", ");
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

interface DeliveryCardProps {
	delivery: Delivery;
}

export function DeliveryCard({ delivery }: DeliveryCardProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchDeliveriesByDeliveryIdStatus();

	const actions = NEXT_ACTIONS[delivery.status] ?? [];
	const totalBRL = (Number(delivery.order.total) / 100).toLocaleString("pt-BR", {
		currency: "BRL",
		style: "currency",
	});
	const showNavigate = delivery.status === "a_caminho" && delivery.order.address != null;

	async function handleAction(status: string, destructive?: boolean) {
		if (destructive) {
			const confirmed = await showConfirm(
				t(status === "recusada" ? "courier.actions.refuse" : "courier.actions.markFailed"),
			);
			if (!confirmed) return;
		}

		patch.mutate(
			{
				data: { status: status as "aceita" | "a_caminho" | "entregue" | "recusada" | "falhou" },
				deliveryId: delivery.id,
			},
			{
				onError: () => void showAlert(t("courier.loadError")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getDeliveriesQueryKey() }),
			},
		);
	}

	return (
		<div className="space-y-3 rounded-lg border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="font-semibold">{delivery.order.customerName}</p>
					<p className="text-muted-foreground text-sm">{delivery.unitName}</p>
				</div>
				<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium text-xs">
					{t(`admin.deliveries.status.${delivery.status}`, { defaultValue: delivery.status })}
				</span>
			</div>

			<div className="space-y-0.5 text-muted-foreground text-sm">
				<p>
					{t("courier.order.items", { count: delivery.order.items.length })}
					{" · "}
					{delivery.order.items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
				</p>
				<p className="font-medium text-foreground">{totalBRL}</p>
			</div>

			{(actions.length > 0 || showNavigate) && (
				<div className="flex flex-wrap gap-2 pt-1">
					{showNavigate && (
						<a
							className={buttonClassName({ size: "sm", variant: "outline" })}
							href={buildMapsUrl(delivery.order.address!)}
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("courier.actions.navigate")}
						</a>
					)}
					{actions.map(action => (
						<Button
							disabled={patch.isPending}
							key={action.status}
							onClick={() => handleAction(action.status, action.destructive)}
							size="sm"
							type="button"
							variant={action.destructive ? "outline" : "default"}
						>
							{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
							{t(action.labelKey as any)}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}
