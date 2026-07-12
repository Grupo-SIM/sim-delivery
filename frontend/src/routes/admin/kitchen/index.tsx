import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetOrders } from "@/lib/api";
import { KitchenOrderCard } from "./components";

function KitchenPage() {
	const { t } = useTranslation();

	const {
		data: allOrders,
		isError,
		isPending,
		refetch,
	} = useGetOrders({}, { query: { refetchInterval: 30_000 } });

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
					<section className="space-y-3">
						<h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							{t("admin.kitchen.columns.recebido")} ({recebido.length})
						</h2>
						{recebido.map(o => (
							<KitchenOrderCard key={o.id} order={o} />
						))}
					</section>
					<section className="space-y-3">
						<h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							{t("admin.kitchen.columns.emPreparo")} ({emPreparo.length})
						</h2>
						{emPreparo.map(o => (
							<KitchenOrderCard key={o.id} order={o} />
						))}
					</section>
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/kitchen/")({
	component: KitchenPage,
});
