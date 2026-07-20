import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetOrders, useGetUnits } from "@/lib/api";
import { OrdersKanban } from "./components";

const STATUS_FILTERS = [
	"all",
	"awaiting_payment",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
] as const;

const KANBAN_STATUSES = [
	"awaiting_payment",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function OrdersPage() {
	const { t } = useTranslation();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [unitId, setUnitId] = useState<string>("all");
	const [deliveryMethod, setDeliveryMethod] = useState<string>("all");
	const [search, setSearch] = useState("");

	const { data: units, isPending: unitsPending } = useGetUnits();

	const {
		data: orders,
		isError,
		isPending,
	} = useGetOrders({
		...(statusFilter !== "all" ? { status: statusFilter } : {}),
		...(unitId !== "all" ? { unitId } : {}),
		...(deliveryMethod !== "all" ? { deliveryMethod: deliveryMethod as "delivery" | "pickup" } : {}),
		...(search.trim() ? { search: search.trim() } : {}),
	});

	const unitOptions = [
		{ label: t("admin.orders.filter.unitAll"), value: "all" },
		...(units ?? []).map(u => ({ label: u.name, value: u.id })),
	];

	const methodOptions = [
		{ label: t("admin.orders.filter.all"), value: "all" },
		{ label: t("store.checkout.order.delivery"), value: "delivery" },
		{ label: t("store.checkout.order.pickup"), value: "pickup" },
	];
	const visibleStatuses = statusFilter === "all" ? KANBAN_STATUSES : [statusFilter];

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

			<div className="flex flex-wrap items-end gap-4">
				<div className="w-60">
					<TextField
						label={t("admin.orders.filter.search")}
						onValueChange={setSearch}
						placeholder={t("admin.orders.filter.searchPlaceholder")}
						value={search}
					/>
				</div>
				<div>
					<p className="mb-1 font-medium text-sm">{t("admin.orders.filter.unit")}</p>
					<CustomSelect className="w-48" onChange={setUnitId} options={unitOptions} value={unitId} />
				</div>
				<div>
					<p className="mb-1 font-medium text-sm">{t("admin.orders.columns.method")}</p>
					<CustomSelect
						className="w-40"
						onChange={setDeliveryMethod}
						options={methodOptions}
						value={deliveryMethod}
					/>
				</div>
			</div>

			{isPending || unitsPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.orders.loadError")} />
			) : (
				<OrdersKanban orders={orders} statuses={visibleStatuses} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/orders/")({
	component: OrdersPage,
});
