import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuBike, LuChevronRight, LuReceiptText, LuShoppingBag } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCustomerOrders } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";
import { slug } from "@/lib/variant";
import { useAuthStore } from "@/stores/auth";

/** Terminal statuses render muted; everything else reads as an active order. */
const CLOSED_STATUSES = new Set(["entregue", "retirado", "cancelado"]);

function statusToneClass(status: string): string {
	if (status === "cancelado") return "bg-destructive/10 text-destructive";
	if (status === "awaiting_payment") return "bg-warning/10 text-warning";
	if (status === "recebido") return "bg-success/10 text-success";
	if (CLOSED_STATUSES.has(status)) return "bg-muted text-muted-foreground";
	return "bg-primary/10 text-primary";
}

function OrdersPage() {
	const { t } = useTranslation();
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const hydrated = useAuthStore(state => state.hydrated);
	const { data: orders, isError, isPending } = useGetCustomerOrders(slug ?? "", isAuthenticated);

	if (hydrated && !isAuthenticated) {
		return (
			<Container className="max-w-2xl space-y-6 py-10">
				<SectionHeading
					subtitle={t("store.account.orders.subtitle")}
					title={t("store.account.orders.title")}
				/>
				<EmptyState
					action={
						<Link
							className="inline-block rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground text-sm"
							to="/identify"
						>
							{t("store.account.signIn")}
						</Link>
					}
					title={t("store.account.orders.signInPrompt")}
				/>
			</Container>
		);
	}

	return (
		<Container className="max-w-6xl space-y-6 py-8">
			<SectionHeading subtitle={t("store.account.orders.subtitle")} title={t("store.account.orders.title")} />

			{!hydrated || isPending ? (
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("store.account.orders.loadError")} />
			) : orders.length === 0 ? (
				<EmptyState title={t("store.account.orders.empty")} />
			) : (
				<ul className="space-y-3">
					{orders.map(order => {
						const DeliveryIcon = order.deliveryMethod === "delivery" ? LuBike : LuShoppingBag;
						const visibleStatus = order.status;

						return (
							<li key={order.id}>
								<Link
									className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm"
									params={{ orderId: order.id }}
									to="/orders/$orderId"
								>
									<span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
										<LuReceiptText className="size-5" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p className="truncate font-semibold text-sm">{order.unitName}</p>
											<span
												className={`shrink-0 rounded-full px-2 py-0.5 font-semibold text-xs ${statusToneClass(visibleStatus)}`}
											>
												{t(`store.checkout.tracking.status.${visibleStatus}`, {
													defaultValue: visibleStatus,
												})}
											</span>
										</div>
										<p className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
											<DeliveryIcon className="size-3.5" />
											{t("store.account.orders.itemsCount", { count: order.itemsCount })}
											{" · "}
											{new Date(order.createdAt).toLocaleDateString()}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-1 text-right">
										<span className="font-semibold text-sm">{formatMoney(order.total / 100)}</span>
										<LuChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
									</div>
								</Link>
								{(order.status === "entregue" || order.status === "retirado") && (
									<Link
										className="mt-1.5 inline-block text-primary text-xs underline"
										params={{ unitId: order.unitSlug }}
										search={{ orderId: order.id }}
										to="/$unitId/rate"
									>
										{t("store.account.orders.rate")}
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/orders/")({
	component: OrdersPage,
});
