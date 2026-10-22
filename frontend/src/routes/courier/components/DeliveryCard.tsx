import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import {
	type GetDeliveries200,
	getDeliveriesQueryKey,
	usePatchDeliveriesByDeliveryIdStatus,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

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
	const parts = [addr.addressLine, addr.number, addr.neighborhood, addr.city, addr.state, addr.zipCode]
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
	const address = delivery.order.address;
	const showNavigate = delivery.status === "a_caminho" && address != null;

	function handleAction(status: string, labelKey: string) {
		patch.mutate(
			{
				data: { status: status as "aceita" | "a_caminho" | "entregue" | "recusada" | "falhou" },
				deliveryId: delivery.id,
			},
			{
				onError: () => void showAlert(t("courier.loadError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getDeliveriesQueryKey() });
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					showToast(t(labelKey as any), "positive");
				},
			},
		);
	}

	return (
		<div className="space-y-3 rounded-lg border border-border bg-card text-card-foreground p-4">
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
				<p className="font-medium text-foreground">
					{t("courier.order.identifier", { id: delivery.order.id })}
				</p>
				{address && (
					<div>
						<p>{t("courier.order.address")}</p>
						<p>
							{address.addressLine}, {address.number}
							{address.complement ? ` — ${address.complement}` : ""}
						</p>
						<p>
							{address.neighborhood ? `${address.neighborhood}, ` : ""}
							{address.city}
							{address.state ? ` - ${address.state}` : ""}
							{" · "}
							{t("courier.order.zipCode", { zipCode: address.zipCode })}
						</p>
					</div>
				)}
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
							href={buildMapsUrl(address!)}
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("courier.actions.navigate")}
						</a>
					)}
					{actions.map(action => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const label = t(action.labelKey as any);
						return action.destructive ? (
							<ConfirmActionButton
								confirmation={label}
								confirmLabel={label}
								disabled={patch.isPending}
								key={action.status}
								onConfirm={() => handleAction(action.status, action.labelKey)}
								size="sm"
								type="button"
								variant="outline"
							>
								{label}
							</ConfirmActionButton>
						) : (
							<Button
								disabled={patch.isPending}
								key={action.status}
								onClick={() => handleAction(action.status, action.labelKey)}
								size="sm"
								type="button"
							>
								{label}
							</Button>
						);
					})}
				</div>
			)}
		</div>
	);
}
