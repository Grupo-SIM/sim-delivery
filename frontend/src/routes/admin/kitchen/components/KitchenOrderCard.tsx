import { useQueryClient } from "@tanstack/react-query";
import { LuChefHat, LuClock3, LuPackageCheck } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type GetOrders200, getOrdersQueryKey, usePatchOrdersByOrderIdStatus } from "@/lib/api";
import { showAlert } from "@/stores";

interface KitchenOrderCardProps {
	order: GetOrders200[number];
}

/** Older tickets need to jump out — color the timer by how long it's been waiting. */
function urgencyClass(minutes: number): string {
	if (minutes >= 25) return "bg-destructive/10 text-destructive";
	if (minutes >= 12) return "bg-amber-100 text-amber-800";
	return "bg-emerald-100 text-emerald-700";
}

export function KitchenOrderCard({ order }: KitchenOrderCardProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchOrdersByOrderIdStatus();

	const elapsed = Math.max(0, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000));
	const elapsedLabel =
		elapsed < 1
			? t("admin.kitchen.order.justNow")
			: t("admin.kitchen.order.ago", {
					time: elapsed < 60 ? `${elapsed}min` : `${Math.floor(elapsed / 60)}h${String(elapsed % 60).padStart(2, "0")}`,
				});

	const isReceived = order.status === "recebido";
	const accent = isReceived ? "border-l-blue-500" : "border-l-amber-500";
	const StageIcon = isReceived ? LuChefHat : LuPackageCheck;
	const itemsTotal = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

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
		<div className={`space-y-3 rounded-xl border border-border border-l-4 bg-card p-4 shadow-sm transition hover:shadow-md ${accent}`}>
			<div className="flex items-center justify-between gap-2">
				<span className="rounded-md bg-muted px-2 py-0.5 font-mono font-semibold text-foreground text-xs">
					#{order.id.slice(-6).toUpperCase()}
				</span>
				<span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs ${urgencyClass(elapsed)}`}>
					<LuClock3 className="size-3" />
					{elapsedLabel}
				</span>
			</div>

			<div className="flex items-center justify-between gap-2">
				<p className="truncate font-semibold text-base">{order.customerName}</p>
				<span className="shrink-0 text-muted-foreground text-xs">
					{t("admin.kitchen.order.itemsCount", { count: itemsTotal })}
				</span>
			</div>

			<ul className="space-y-1.5">
				{order.items.map(item => (
					<li className="flex gap-2 text-sm" key={item.id}>
						<span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-md bg-primary/10 px-1 font-bold text-primary text-xs">
							{item.quantity}
						</span>
						<span className="pt-0.5">
							{item.productName}
							<span className="text-muted-foreground italic">
								{" "}
								— {item.note || t("admin.kitchen.order.noNote")}
							</span>
						</span>
					</li>
				))}
			</ul>

			{isReceived ? (
				<Button className="w-full gap-2" disabled={patch.isPending} onClick={() => advance("em_preparo")} type="button">
					<StageIcon className="size-4" />
					{t("admin.kitchen.order.start")}
				</Button>
			) : (
				<Button className="w-full gap-2" disabled={patch.isPending} onClick={() => advance("pronto")} type="button">
					<StageIcon className="size-4" />
					{t("admin.kitchen.order.ready")}
				</Button>
			)}
		</div>
	);
}
