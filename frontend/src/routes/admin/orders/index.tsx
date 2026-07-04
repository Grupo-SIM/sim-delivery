import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetOrders, useGetUnits } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
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
	const [unitId, setUnitId] = useState<string>("all");
	const [deliveryMethod, setDeliveryMethod] = useState<string>("all");
	const [search, setSearch] = useState("");

	const { data: units } = useGetUnits();

	const { data: orders, isError, isPending } = useGetOrders({
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
						placeholder="Search by name, phone or order id"
						value={search}
					/>
				</div>
				<div>
					<p className="mb-1 text-sm font-medium">{t("admin.orders.filter.unit")}</p>
					<CustomSelect
						className="w-48"
						onChange={setUnitId}
						options={unitOptions}
						value={unitId}
					/>
				</div>
				<div>
					<p className="mb-1 text-sm font-medium">{t("admin.orders.columns.method")}</p>
					<CustomSelect
						className="w-40"
						onChange={setDeliveryMethod}
						options={methodOptions}
						value={deliveryMethod}
					/>
				</div>
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
