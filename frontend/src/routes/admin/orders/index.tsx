import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetOrders, useGetUnits } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { DashboardDateRangePicker } from "../components/DashboardDateRangePicker";
import { OrdersKanban } from "./components";

const KANBAN_STATUSES = [
	"awaiting_payment",
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"problema",
	"entregue",
	"retirado",
	"cancelado",
] as const;

const KITCHEN_KANBAN_STATUSES = ["recebido", "em_preparo", "pronto"] as const;
const COURIER_KANBAN_STATUSES = ["pronto", "saiu_para_entrega", "entregue"] as const;

function getAvailableStatuses(role: string | null): readonly (typeof KANBAN_STATUSES)[number][] {
	if (role === "kitchen") return KITCHEN_KANBAN_STATUSES;
	if (role === "courier") return COURIER_KANBAN_STATUSES;
	return KANBAN_STATUSES;
}

function OrdersPage() {
	const { t } = useTranslation();
	const role = useAuthStore(state => state.role);
	const [search, setSearch] = useState("");
	const [dateRange, setDateRange] = useState<{ endDate: string; startDate: string } | null>(null);
	const [unitId, setUnitId] = useState("");
	const unitsQuery = useGetUnits();

	const {
		data: orders,
		isError,
		isPending,
	} = useGetOrders({
		...(unitId ? { unitId } : {}),
		...(search.trim() ? { search: search.trim() } : {}),
		...(dateRange
			? {
					from: `${dateRange.startDate}T00:00:00`,
					to: `${dateRange.endDate}T23:59:59.999`,
				}
			: {}),
	});
	const availableStatuses = getAvailableStatuses(role);

	return (
		<Container className="space-y-6 py-6 sm:py-8" size="full">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<SectionHeading subtitle={t("admin.orders.subtitle")} title={t("admin.orders.title")} />
			</div>

			<div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)_minmax(0,2fr)] md:items-start">
				<TextField
					label={t("admin.orders.filter.search")}
					onValueChange={setSearch}
					placeholder={t("admin.orders.filter.searchPlaceholder")}
					value={search}
				/>
				<div className="flex flex-col gap-1">
					<span className="font-medium text-sm">{t("admin.orders.filter.date")}</span>
					<DashboardDateRangePicker
						onChange={setDateRange}
						placeholder={t("admin.orders.filter.datePlaceholder")}
						value={dateRange}
					/>
				</div>
				<div className="space-y-1">
					<span className="font-medium text-sm">{t("admin.orders.filter.unit")}</span>
					<CustomSelect
						onChange={setUnitId}
						options={[
							{ label: t("admin.orders.filter.unitAll"), value: "" },
							...(unitsQuery.data?.map(unit => ({ label: unit.name, value: unit.id })) ?? []),
						]}
						value={unitId}
					/>
				</div>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.orders.loadError")} />
			) : (
				<OrdersKanban orders={orders} role={role} statuses={availableStatuses} />
			)}
		</Container>
	);
}
export const Route = createFileRoute("/admin/orders/")({ component: OrdersPage });
