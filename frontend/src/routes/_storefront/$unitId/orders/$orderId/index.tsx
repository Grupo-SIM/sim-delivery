import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	LuBike,
	LuCheck,
	LuChefHat,
	LuCircleCheck,
	LuCircleX,
	LuClock3,
	LuPackageCheck,
	LuShoppingBag,
} from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCustomerOrder } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";
import { slug } from "@/lib/variant";

function formatStatusTime(value?: string) {
	if (!value) return null;
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "2-digit",
	}).format(new Date(value));
}

const STATUS_COPY = {
	em_preparo: {
		description: "store.checkout.tracking.status.em_preparoDescription",
		icon: LuChefHat,
		title: "store.checkout.tracking.status.em_preparo",
	},
	entregue: {
		description: "store.checkout.tracking.status.entregueDescription",
		icon: LuCircleCheck,
		title: "store.checkout.tracking.status.entregue",
	},
	pronto: {
		description: "store.checkout.tracking.status.prontoDeliveryDescription",
		icon: LuPackageCheck,
		title: "store.checkout.tracking.status.pronto",
	},
	recebido: {
		description: "store.checkout.tracking.status.recebidoDescription",
		icon: LuCheck,
		title: "store.checkout.tracking.status.recebido",
	},
	retirado: {
		description: "store.checkout.tracking.status.retiradoDescription",
		icon: LuCircleCheck,
		title: "store.checkout.tracking.status.retirado",
	},
	saiu_para_entrega: {
		description: "store.checkout.tracking.status.saiu_para_entregaDescription",
		icon: LuBike,
		title: "store.checkout.tracking.status.saiu_para_entrega",
	},
} as const;

function OrderTrackingPage() {
	const { t } = useTranslation();
	const { orderId, unitId } = Route.useParams();
	const { data: order, isError, isPending } = useGetCustomerOrder(orderId, slug ?? "");

	if (isPending) {
		return (
			<Container className="max-w-lg space-y-5 py-10">
				<Skeleton className="h-20 w-2/3" />
				<Skeleton className="h-72 w-full" />
			</Container>
		);
	}

	if (isError || !order) {
		return (
			<Container className="max-w-lg space-y-6 py-10">
				<ErrorState title={t("store.checkout.tracking.empty")} />
				<Link className="block text-center text-primary text-sm underline" params={{ unitId }} to="/$unitId">
					{t("store.checkout.tracking.back")}
				</Link>
			</Container>
		);
	}

	const stages =
		order.deliveryMethod === "delivery"
			? ["recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue"]
			: ["recebido", "em_preparo", "pronto", "retirado"];
	const stageIndex = stages.indexOf(order.status);
	const eventByStatus = new Map(order.statusEvents.map(event => [event.status, event.createdAt]));
	const current = STATUS_COPY[order.status as keyof typeof STATUS_COPY];
	const CurrentIcon = current?.icon ?? LuClock3;
	const currentDescription =
		order.status === "pronto" && order.deliveryMethod === "pickup"
			? t("store.checkout.tracking.status.prontoPickupDescription")
			: current
				? t(current.description)
				: t("store.checkout.tracking.status.awaiting_payment");

	return (
		<Container className="max-w-lg space-y-6 py-8">
			<SectionHeading subtitle={t("store.checkout.tracking.subtitle")} title={t("store.checkout.tracking.title")} />

			{order.status === "cancelado" ? (
				<div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-5">
					<LuCircleX className="size-7 text-destructive" />
					<p className="font-semibold">{t("store.checkout.tracking.cancelled")}</p>
					<p className="text-muted-foreground text-sm">
						{order.cancelReason || t("store.checkout.tracking.cancelledDescription")}
					</p>
				</div>
			) : (
				<>
					<div className="flex animate-in items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-5 fade-in slide-in-from-bottom-2 duration-500">
						<CurrentIcon className="mt-0.5 size-6 animate-pulse text-primary" />
						<div className="space-y-1">
							<p className="font-semibold">{current ? t(current.title) : t("store.checkout.tracking.status.awaiting_payment")}</p>
							<p className="text-muted-foreground text-sm">{currentDescription}</p>
						</div>
					</div>

					<ol className="space-y-0 rounded-lg border border-border bg-card p-5">
						{stages.map((status, index) => {
							const copy = STATUS_COPY[status as keyof typeof STATUS_COPY];
							const Icon = copy.icon;
							const complete = stageIndex >= index;
							const statusTime = complete ? formatStatusTime(eventByStatus.get(status)) : null;
							return (
								<li className="flex animate-in gap-3 fade-in slide-in-from-left-2 duration-500" key={status} style={{ animationDelay: `${index * 90}ms`, animationFillMode: "both" }}>
									<div className="flex flex-col items-center">
										<div className={`grid size-7 place-items-center rounded-full transition-all duration-500 ${complete ? "scale-105 bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}>
											<Icon className="size-4" />
										</div>
										{index < stages.length - 1 && <div className={`h-10 w-px ${stageIndex > index ? "bg-primary" : "bg-border"}`} />}
									</div>
									<div className="pb-4 pt-0.5">
										<p className={`font-medium text-sm ${complete ? "text-foreground" : "text-muted-foreground"}`}>{t(copy.title)}</p>
										{statusTime && <p className="mt-1 text-muted-foreground text-xs">{statusTime}</p>}
									</div>
								</li>
							);
						})}
					</ol>
				</>
			)}

			{(order.status === "entregue" || order.status === "retirado") && (
				<Link
					className="block rounded-lg border border-primary/30 bg-primary/5 p-4 text-center font-medium text-primary text-sm"
					params={{ unitId }}
					search={{ orderId }}
					to="/$unitId/rate"
				>
					{t("store.checkout.tracking.rate")}
				</Link>
			)}

			<section className="space-y-3 rounded-lg border border-border bg-card p-5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 font-semibold"><LuShoppingBag className="size-4" /> {order.unitName}</div>
					<span className="font-semibold">{formatMoney(order.total / 100)}</span>
				</div>
				<p className="font-medium text-sm">{t("store.checkout.tracking.items")}</p>
				<ul className="space-y-2 text-muted-foreground text-sm">
					{order.items.map(item => (
						<li key={item.id}>{item.quantity}x {item.productName}{item.note ? ` - ${item.note}` : ""}</li>
					))}
				</ul>
			</section>

			<p className="flex items-center justify-center gap-2 text-muted-foreground text-xs"><LuClock3 className="size-3" /> {t("store.checkout.tracking.refreshing")}</p>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/orders/$orderId/")({
	component: OrderTrackingPage,
});
