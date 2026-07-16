import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { type GetOrders200, useGetOrders } from "@/lib/api";
import { KitchenOrderCard } from "./components";

interface KitchenColumnProps {
	dotClass: string;
	emptyLabel: string;
	orders: GetOrders200;
	title: string;
}

function KitchenColumn({ dotClass, emptyLabel, orders, title }: KitchenColumnProps) {
	return (
		<section className="space-y-3 rounded-2xl bg-muted/40 p-3">
			<h2 className="flex items-center gap-2 px-1 py-1 font-semibold text-sm uppercase tracking-wide">
				<span className={`size-2.5 rounded-full ${dotClass}`} />
				{title}
				<span className="ml-auto rounded-full bg-background px-2 py-0.5 font-bold text-muted-foreground text-xs">
					{orders.length}
				</span>
			</h2>
			{orders.length === 0 ? (
				<p className="rounded-xl border border-border border-dashed py-8 text-center text-muted-foreground text-sm">{emptyLabel}</p>
			) : (
				orders.map(order => <KitchenOrderCard key={order.id} order={order} />)
			)}
		</section>
	);
}

function KitchenPage() {
	const { t } = useTranslation();

	const {
		data: allOrders,
		isError,
		isPending,
		refetch,
	} = useGetOrders({}, { query: { refetchInterval: 5_000 } });

	const recebido = (allOrders ?? []).filter(o => o.status === "recebido");
	const emPreparo = (allOrders ?? []).filter(o => o.status === "em_preparo");
	const active = recebido.length + emPreparo.length;

	return (
		<Container className="space-y-6 py-8">
			<div className="flex items-center justify-between">
				<SectionHeading subtitle={t("admin.kitchen.subtitle")} title={t("admin.kitchen.title")} />
				<Button onClick={() => refetch()} size="sm" type="button" variant="outline">
					{t("admin.kitchen.refresh")}
				</Button>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.kitchen.loadError")} />
			) : active === 0 ? (
				<EmptyState title={t("admin.kitchen.empty")} />
			) : (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<KitchenColumn
						dotClass="bg-blue-500"
						emptyLabel={t("admin.kitchen.emptyColumn")}
						orders={recebido}
						title={t("admin.kitchen.columns.recebido")}
					/>
					<KitchenColumn
						dotClass="bg-amber-500"
						emptyLabel={t("admin.kitchen.emptyColumn")}
						orders={emPreparo}
						title={t("admin.kitchen.columns.emPreparo")}
					/>
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/kitchen/")({
	component: KitchenPage,
});
