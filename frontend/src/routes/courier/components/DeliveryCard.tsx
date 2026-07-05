import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
	getDeliveriesQueryKey,
	type GetDeliveries200,
	usePatchDeliveriesByDeliveryIdStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { showAlert, showConfirm } from "@/stores";

type Delivery = GetDeliveries200[number];

const NEXT_ACTIONS: Record<string, { status: string; labelKey: string; destructive?: boolean }[]> = {
	atribuida: [
		{ status: "aceita", labelKey: "courier.actions.accept" },
		{ status: "recusada", labelKey: "courier.actions.refuse", destructive: true },
	],
	aceita: [
		{ status: "a_caminho", labelKey: "courier.actions.startRoute" },
		{ status: "recusada", labelKey: "courier.actions.refuse", destructive: true },
	],
	a_caminho: [
		{ status: "entregue", labelKey: "courier.actions.markDelivered" },
		{ status: "falhou", labelKey: "courier.actions.markFailed", destructive: true },
	],
};

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

	async function handleAction(status: string, destructive?: boolean) {
		if (destructive) {
			const confirmed = await showConfirm(
				t(status === "recusada" ? "courier.actions.refuse" : "courier.actions.markFailed"),
			);
			if (!confirmed) return;
		}

		patch.mutate(
			{ data: { status: status as "aceita" | "a_caminho" | "entregue" | "recusada" | "falhou" }, deliveryId: delivery.id },
			{
				onError: () => void showAlert(t("courier.loadError")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getDeliveriesQueryKey() }),
			},
		);
	}

	return (
		<div className="rounded-lg border border-border bg-card p-4 space-y-3">
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="font-semibold">{delivery.order.customerName}</p>
					<p className="text-muted-foreground text-sm">{delivery.unitName}</p>
				</div>
				<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium shrink-0">
					{t(`admin.deliveries.status.${delivery.status}`, { defaultValue: delivery.status })}
				</span>
			</div>

			<div className="text-sm text-muted-foreground space-y-0.5">
				<p>
					{t("courier.order.items", { count: delivery.order.items.length })}
					{" · "}
					{delivery.order.items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
				</p>
				<p className="font-medium text-foreground">{totalBRL}</p>
			</div>

			{actions.length > 0 && (
				<div className="flex gap-2 pt-1">
					{actions.map(action => (
						<Button
							disabled={patch.isPending}
							key={action.status}
							onClick={() => handleAction(action.status, action.destructive)}
							size="sm"
							type="button"
							variant={action.destructive ? "outline" : "default"}
						>
							{t(action.labelKey as Parameters<typeof t>[0])}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}
