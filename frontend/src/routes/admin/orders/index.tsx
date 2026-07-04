import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetOrders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";
import { OrdersTable } from "./components";

const STATUS_FILTERS = [
	"all",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
] as const;

function OrdersPage() {
	const { t } = useTranslation();
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { data: orders, isError, isPending } = useGetOrders({
		...(statusFilter !== "all" ? { status: statusFilter } : {}),
	});

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.orders.subtitle")} title={t("admin.orders.title")} />

			<div className="flex flex-wrap gap-2">
				{STATUS_FILTERS.map(s => (
					<Button
						key={s}
						onClick={() => setStatusFilter(s)}
						size="sm"
						type="button"
						variant={statusFilter === s ? "default" : "outline"}
					>
						{t(`admin.orders.status.${s}`, { defaultValue: s })}
					</Button>
				))}
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.orders.loadError")} />
			) : (
				<OrdersTable orders={orders} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/orders/")({
	beforeLoad: requireStaffBeforeLoad,
	component: OrdersPage,
});
