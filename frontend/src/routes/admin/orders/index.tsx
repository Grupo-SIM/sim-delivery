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
import { AutoPrintControls, OrdersKanban, OriginMetrics } from "./components";
import { useAutoPrintOrders } from "./use-auto-print-orders";
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
	const [origin, setOrigin] = useState<"" | "bio" | "instagram">("");
	const unitsQuery = useGetUnits();
	const canViewAllUnits = canAccessAllUnits(role);

	useEffect(() => {
		const units = unitsQuery.data ?? [];
		if (canViewAllUnits || units.length === 0 || units.some(unit => unit.id === unitId)) return;
		setUnitId(units[0].id);
	}, [canViewAllUnits, unitId, unitsQuery.data]);

	const originFilter = {
		...(origin === "bio" ? { utmContent: "link_in_bio", utmMedium: "social", utmSource: "ig" } : {}),
		...(origin === "instagram" ? { utmSource: "ig" } : {}),
	};
	const ordersQuery = useGetOrders({
		...(unitId ? { unitId } : {}),
		...(search.trim() ? { search: search.trim() } : {}),
		...originFilter,
		...(dateRange
			? {
					from: dateRange.startDate,
					to: dateRange.endDate,
				}
			: {}),
	});
	useOrderEvents(unitId);
	useAutoPrintOrders(unitId);
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
		<Container className="flex h-full min-h-0 min-w-0 flex-col gap-6 scrollbar-themed overflow-y-auto py-6 sm:py-8 md:overflow-hidden" size="full">
			<div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

			<div className="flex shrink-0 flex-wrap items-start gap-4">
				<div className="min-w-56 flex-[2_1_14rem]">
				<TextField
					label={t("admin.orders.filter.search")}
					onValueChange={setSearch}
					placeholder={t("admin.orders.filter.searchPlaceholder")}
					value={search}
				/>
				</div>
				<div className="flex flex-col gap-1">
					<span className="font-medium text-sm">{t("admin.orders.filter.date")}</span>
					<DashboardDateRangePicker
						onChange={setDateRange}
						placeholder={t("admin.orders.filter.datePlaceholder")}
						value={dateRange}
					/>
				</div>
				<div className="min-w-48 flex-[1_1_12rem] space-y-1">
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
				<div className="min-w-48 flex-[1_1_12rem] space-y-1">
					<span className="font-medium text-sm">{t("admin.orders.origin.filter.label")}</span>
					<CustomSelect
						onChange={value => setOrigin(value as typeof origin)}
						options={[
							{ label: t("admin.orders.origin.filter.all"), value: "" },
							{ label: t("admin.orders.origin.filter.bio"), value: "bio" },
							{ label: t("admin.orders.origin.filter.instagram"), value: "instagram" },
						]}
						value={origin}
					/>
				</div>
				<AutoPrintControls />
			</div>

			{canViewAllUnits && !ordersQuery.isPending && <OriginMetrics orders={ordersQuery.data ?? []} />}

			{unitsQuery.isPending || ordersQuery.isPending ? (
				<div className="grid min-h-0 flex-1 gap-4 overflow-hidden sm:grid-cols-3">
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
