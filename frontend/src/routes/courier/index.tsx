import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetDeliveries } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth";
import { DeliveryCard } from "./components";

const ACTIVE_STATUSES = new Set(["atribuida", "aceita", "a_caminho"]);
const TERMINAL_STATUSES = new Set(["entregue", "falhou", "recusada"]);

function CourierPage() {
	const { t } = useTranslation();
	const userId = useAuthStore(s => s.user?.id ?? "");

	const {
		data: deliveries,
		isError,
		isPending,
	} = useGetDeliveries({ courierId: userId }, { query: { refetchInterval: 30_000 } });

	const active = (deliveries ?? [])
		.filter(d => ACTIVE_STATUSES.has(d.status))
		.sort((a, b) => (a.order.address?.zipCode ?? "").localeCompare(b.order.address?.zipCode ?? ""));
	const history = (deliveries ?? [])
		.filter(d => TERMINAL_STATUSES.has(d.status))
		.sort((a, b) => (a.order.address?.zipCode ?? "").localeCompare(b.order.address?.zipCode ?? ""))
		.slice(0, 10);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("courier.subtitle")} title={t("courier.title")} />

			{isPending ? (
				<div className="space-y-3">
					<Skeleton className="h-52 w-full" />
					<Skeleton className="h-52 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("courier.loadError")} />
			) : (
				<>
					{active.length === 0 ? (
						<EmptyState title={t("courier.empty")} />
					) : (
						<div className="space-y-3">
							{active.map(d => (
								<DeliveryCard delivery={d} key={d.id} />
							))}
						</div>
					)}

					{history.length > 0 && (
						<div className="space-y-3">
							<h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
								{t("courier.history")}
							</h2>
							<div className="space-y-3 opacity-60">
								{history.map(d => (
									<DeliveryCard delivery={d} key={d.id} />
								))}
							</div>
						</div>
					)}
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/courier/")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		const role = (session.data?.user as { role?: string } | null)?.role ?? null;
		if (!session.data?.user || role !== "courier") {
			throw redirect({ search: { redirectTo: undefined }, to: "/identify" });
		}
	},
	component: CourierPage,
});
