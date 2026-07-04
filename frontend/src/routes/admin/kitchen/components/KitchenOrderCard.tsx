import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getOrdersQueryKey, usePatchOrdersByOrderIdStatus, type GetOrders200 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { showAlert } from "@/stores";

interface KitchenOrderCardProps {
	order: GetOrders200[number];
}

export function KitchenOrderCard({ order }: KitchenOrderCardProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchOrdersByOrderIdStatus();

	const elapsed = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);

	function advance(status: "em_preparo" | "pronto") {
		patch.mutate(
			{ data: { status }, orderId: order.id },
			{
				onError: () => void showAlert(t("admin.orders.updateStatus.error")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() }),
			},
		);
	}

	return (
		<div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
			<div className="flex items-center justify-between">
				<span className="font-mono text-xs text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
				<span className="text-xs text-muted-foreground">{elapsed}m ago</span>
			</div>

			<p className="text-sm font-medium">{order.customerName}</p>

			<ul className="space-y-1">
				{order.items.map(item => (
					<li key={item.id} className="text-sm text-muted-foreground">
						{item.quantity}× {item.productName}
						{item.note && <span className="italic"> — {item.note}</span>}
					</li>
				))}
			</ul>

			<div className="pt-1">
				{order.status === "recebido" && (
					<Button
						className="w-full"
						disabled={patch.isPending}
						onClick={() => advance("em_preparo")}
						size="sm"
						type="button"
					>
						{t("admin.kitchen.order.start")}
					</Button>
				)}
				{order.status === "em_preparo" && (
					<Button
						className="w-full"
						disabled={patch.isPending}
						onClick={() => advance("pronto")}
						size="sm"
						type="button"
					>
						{t("admin.kitchen.order.ready")}
					</Button>
				)}
			</div>
		</div>
	);
}
