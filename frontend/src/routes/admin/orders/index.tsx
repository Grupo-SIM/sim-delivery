import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { getOrdersQueryKey, useGetOrders, useGetUnits, usePostOrdersCloseDay } from "@/lib/api";
import { isOperationalStaff } from "@/lib/staff-guard";
import { showToast, useAuthStore } from "@/stores";
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
	const queryClient = useQueryClient();
	const role = useAuthStore(state => state.role);
	const hasOperationalAccess = isOperationalStaff(role);
	const [search, setSearch] = useState("");
	const [date, setDate] = useState("");
	const [unitId, setUnitId] = useState("");
	const unitsQuery = useGetUnits();

	const closeDay = usePostOrdersCloseDay();
	const {
		data: orders,
		isError,
		isPending,
	} = useGetOrders({
		...(unitId ? { unitId } : {}),
		...(search.trim() ? { search: search.trim() } : {}),
		...(date
			? {
					from: new Date(`${date}T00:00:00`).toISOString(),
					to: new Date(`${date}T23:59:59.999`).toISOString(),
				}
			: {}),
	});
	const availableStatuses = getAvailableStatuses(role);

	function closeCurrentDay() {
		closeDay.mutate(undefined, {
			onError: () => showToast("Não foi possível encerrar o dia.", "negative"),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
				showToast("Dia encerrado. O kanban está pronto para novos pedidos.", "positive");
			},
		});
	}

	return (
		<Container className="space-y-6 py-6 sm:py-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<SectionHeading subtitle={t("admin.orders.subtitle")} title={t("admin.orders.title")} />
				{!hasOperationalAccess && (
					<ConfirmActionButton
						confirmation="Pedidos atuais sairão do kanban, mas continuarão disponíveis no histórico."
						confirmLabel="Confirmar"
						disabled={closeDay.isPending || Boolean(date)}
						onConfirm={closeCurrentDay}
						tooltip="Encerrar dia"
						type="button"
						variant="outline"
					>
						{closeDay.isPending ? "Encerrando..." : "Encerrar dia"}
					</ConfirmActionButton>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_11rem_minmax(0,15rem)] sm:items-end">
				<TextField
					label={t("admin.orders.filter.search")}
					onValueChange={setSearch}
					placeholder={t("admin.orders.filter.searchPlaceholder")}
					value={search}
				/>
				<label className="flex flex-col gap-1" htmlFor="orders-date-filter">
					<span className="font-medium text-sm">{t("admin.orders.filter.date")}</span>
					<Input
						id="orders-date-filter"
						onChange={event => setDate(event.currentTarget.value)}
						type="date"
						value={date}
					/>
				</label>
				<div className="space-y-1">
					<span className="font-medium text-sm">Unidade</span>
					<CustomSelect
						onChange={setUnitId}
						options={[
							{ label: "Todas as unidades", value: "" },
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
