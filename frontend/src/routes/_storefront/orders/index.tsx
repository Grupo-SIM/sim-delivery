import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Terminal statuses render muted; everything else reads as an active order. */
const CLOSED_STATUSES = new Set(["entregue", "retirado", "cancelado"]);

function displayStatus(status: string, createdAt: string): string {
	if (status === "awaiting_payment" && Date.now() - new Date(createdAt).getTime() > ONE_DAY_MS)
		return "cancelado";
	return status;
}

function statusToneClass(status: string): string {
	if (status === "cancelado") return "bg-destructive/10 text-destructive";
	if (status === "awaiting_payment") return "bg-amber-100 text-amber-800";
	if (status === "recebido") return "bg-emerald-100 text-emerald-800";
	if (CLOSED_STATUSES.has(status)) return "bg-muted text-muted-foreground";
	return "bg-primary/10 text-primary";
}

const STATUS_ORDER = [
	"awaiting_payment",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
];

function OrdersPage() {
	const { t } = useTranslation();
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const hydrated = useAuthStore(state => state.hydrated);
	const { data: orders, isError, isPending } = useGetCustomerOrders(slug ?? "", isAuthenticated);
	const orderColumns = useMemo(() => {
		if (!orders) return [];
		const grouped = new Map<string, typeof orders>();

		for (const order of orders) {
			const visibleStatus = displayStatus(order.status, order.createdAt);
			grouped.set(visibleStatus, [...(grouped.get(visibleStatus) ?? []), order]);
		}

		return STATUS_ORDER.filter(status => grouped.has(status)).map(status => ({
			orders: grouped.get(status) ?? [],
			status,
		}));
	}, [orders]);

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
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("store.account.orders.loadError")} />
			) : orders.length === 0 ? (
				<EmptyState title={t("store.account.orders.empty")} />
			) : (
				<div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
					{orderColumns.map(column => (
						<section className="rounded-xl border border-border bg-muted/25 p-3" key={column.status}>
							<header className="mb-3 flex items-center justify-between gap-3 px-1">
								<span
									className={`rounded-full px-2 py-0.5 font-semibold text-xs ${statusToneClass(column.status)}`}
								>
									{t(`store.checkout.tracking.status.${column.status}`, { defaultValue: column.status })}
								</span>
								<span className="rounded-md bg-background px-2 py-1 font-semibold text-foreground text-xs shadow-sm">
									{column.orders.length}
								</span>
							</header>
							<ul className="space-y-3">
								{column.orders.map(order => {
									const DeliveryIcon = order.deliveryMethod === "delivery" ? LuBike : LuShoppingBag;
									const visibleStatus = displayStatus(order.status, order.createdAt);
									return (
										<li key={order.id}>
											<Link
												className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm"
												params={{ orderId: order.id, unitId: order.unitSlug }}
												to="/$unitId/orders/$orderId"
											>
												<span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
													<LuReceiptText className="size-5" />
												</span>
												<div className="min-w-0 flex-1">
													<p className="truncate font-semibold text-sm">{order.unitName}</p>
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
						</section>
					))}
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/orders/")({
	component: OrdersPage,
});
