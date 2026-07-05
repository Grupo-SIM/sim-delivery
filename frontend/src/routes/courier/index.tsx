import { redirect } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetDeliveries } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/stores/auth";
import { DeliveryCard } from "./components";

const ACTIVE_STATUSES = new Set(["atribuida", "aceita", "a_caminho"]);

function CourierPage() {
	const { t } = useTranslation();
	const userId = useAuthStore(s => s.user?.id ?? "");

	const { data: deliveries, isError, isPending } = useGetDeliveries(
		{ courierId: userId },
		{ query: { refetchInterval: 30_000 } },
	);

	const active = (deliveries ?? []).filter(d => ACTIVE_STATUSES.has(d.status));

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("courier.subtitle")} title={t("courier.title")} />

			{isPending ? (
				<div className="space-y-3">
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-32 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("courier.loadError")} />
			) : active.length === 0 ? (
				<EmptyState title={t("courier.empty")} />
			) : (
				<div className="space-y-3">
					{active.map(d => (
						<DeliveryCard delivery={d} key={d.id} />
					))}
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/courier/")({
	beforeLoad: () => {
		const { isAuthenticated, role } = useAuthStore.getState();
		if (!isAuthenticated || role !== "courier") {
			throw redirect({ to: "/login" });
		}
	},
	component: CourierPage,
});
