import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuLoaderCircle, LuRefreshCw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetOrders, useGetUnits } from "@/lib/api";
import { canAccessAllUnits } from "@/lib/staff-guard";
import { showToast, useAuthStore } from "@/stores";
import { DashboardDateRangePicker } from "../components/DashboardDateRangePicker";
import { OrdersKanban } from "./components";
import { useOrderEvents } from "./use-order-events";

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
const COURIER_KANBAN_STATUSES = ["pronto", "saiu_para_entrega", "problema", "entregue"] as const;

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
	const canViewAllUnits = canAccessAllUnits(role);

	useEffect(() => {
		const units = unitsQuery.data ?? [];
		if (canViewAllUnits || units.length === 0 || units.some(unit => unit.id === unitId)) return;
		setUnitId(units[0].id);
	}, [canViewAllUnits, unitId, unitsQuery.data]);

	const ordersQuery = useGetOrders({
		...(unitId ? { unitId } : {}),
		...(search.trim() ? { search: search.trim() } : {}),
		...(dateRange
			? {
					from: `${dateRange.startDate}T00:00:00`,
					to: `${dateRange.endDate}T23:59:59.999`,
				}
			: {}),
	});
	useOrderEvents(unitId);
	const availableStatuses = getAvailableStatuses(role);

	async function handleRefresh() {
		try {
			const results = await Promise.all([unitsQuery.refetch(), ordersQuery.refetch()]);
			const error = results.find(result => result.error)?.error;
			if (error) throw error;
			showToast(t("admin.orders.refresh.success"), "positive");
		} catch {
			showToast(t("admin.orders.refresh.error"), "negative");
		}
	}

	return (
		<Container className="space-y-6 py-6 sm:py-8" size="full">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<SectionHeading subtitle={t("admin.orders.subtitle")} title={t("admin.orders.title")} />
				<Button disabled={ordersQuery.isFetching} onClick={() => void handleRefresh()} type="button" variant="outline">
					{ordersQuery.isFetching ? (
						<LuLoaderCircle aria-hidden className="size-4 animate-spin" />
					) : (
						<LuRefreshCw aria-hidden className="size-4" />
					)}
					{t("admin.orders.refresh.action")}
				</Button>
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
							...(canViewAllUnits ? [{ label: t("admin.orders.filter.unitAll"), value: "" }] : []),
							...(unitsQuery.data?.map(unit => ({ label: unit.name, value: unit.id })) ?? []),
						]}
						value={unitId}
					/>
				</div>
			</div>

			{unitsQuery.isPending || ordersQuery.isPending ? (
				<div className="grid gap-4 sm:grid-cols-3">
					{availableStatuses.slice(0, 3).map(status => (
						<div className="space-y-4 rounded-brand border p-4" key={status}>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-48 w-full" />
						</div>
					))}
				</div>
			) : unitsQuery.isError ? (
				<ErrorState title={t("admin.units.loadError")} />
			) : !canViewAllUnits && unitsQuery.data.length === 0 ? (
				<ErrorState
					description={t("admin.orders.noAssignedUnits.description")}
					title={t("admin.orders.noAssignedUnits.title")}
				/>
			) : ordersQuery.isError ? (
				<ErrorState title={t("admin.orders.loadError")} />
			) : (
				<OrdersKanban orders={ordersQuery.data} role={role} statuses={availableStatuses} />
			)}
		</Container>
	);
}
export const Route = createFileRoute("/admin/orders/")({ component: OrdersPage });
