import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { getOrdersQueryKey, useGetOrders, useGetUnits, usePostOrdersCloseDay } from "@/lib/api";
import { showToast } from "@/stores";
import { KANBAN_STATUSES, OrdersKanban } from "./components";

const STATUS_FILTERS = ["all", "awaiting_payment", "recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue", "retirado", "cancelado"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function OrdersPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [unitId, setUnitId] = useState("all");
	const [deliveryMethod, setDeliveryMethod] = useState("all");
	const [search, setSearch] = useState("");
	const [date, setDate] = useState("");
	const closeDay = usePostOrdersCloseDay();
	const { data: units } = useGetUnits();
	const { data: orders, isError, isPending } = useGetOrders({
		...(statusFilter !== "all" ? { status: statusFilter } : {}),
		...(unitId !== "all" ? { unitId } : {}),
		...(deliveryMethod !== "all" ? { deliveryMethod: deliveryMethod as "delivery" | "pickup" } : {}),
		...(search.trim() ? { search: search.trim() } : {}),
		...(date ? { from: `${date}T00:00:00.000`, to: `${date}T23:59:59.999` } : {}),
	});
	const unitOptions = [{ label: t("admin.orders.filter.unitAll"), value: "all" }, ...(units ?? []).map(unit => ({ label: unit.name, value: unit.id }))];
	const methodOptions = [{ label: t("admin.orders.filter.all"), value: "all" }, { label: t("store.checkout.order.delivery"), value: "delivery" }, { label: t("store.checkout.order.pickup"), value: "pickup" }];
	const visibleStatuses = statusFilter === "all" ? KANBAN_STATUSES : [statusFilter];
	function closeCurrentDay() {
		if (!window.confirm("Encerrar dia? Pedidos atuais sairão do kanban, mas continuarão disponíveis no histórico.")) return;
		closeDay.mutate(undefined, { onError: () => showToast("Não foi possível encerrar o dia.", "negative"), onSuccess: () => { queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() }); showToast("Dia encerrado. O kanban está pronto para novos pedidos.", "positive"); } });
	}
	return <Container className="space-y-6 py-8">
		<div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading subtitle={t("admin.orders.subtitle")} title={t("admin.orders.title")} /><Button disabled={closeDay.isPending || Boolean(date)} onClick={closeCurrentDay} type="button" variant="outline">{closeDay.isPending ? "Encerrando..." : "Encerrar dia"}</Button></div>
		<div className="flex flex-wrap gap-2">{STATUS_FILTERS.map(status => <Button key={status} onClick={() => setStatusFilter(status)} size="sm" type="button" variant={statusFilter === status ? "default" : "outline"}>{t(`admin.orders.status.${status}`, { defaultValue: status })}</Button>)}</div>
		<div className="flex flex-wrap items-end gap-4"><div className="w-60"><TextField label={t("admin.orders.filter.search")} onValueChange={setSearch} placeholder={t("admin.orders.filter.searchPlaceholder")} value={search} /></div><div><p className="mb-1 font-medium text-sm">{t("admin.orders.filter.unit")}</p><CustomSelect className="w-48" onChange={setUnitId} options={unitOptions} value={unitId} /></div><div><p className="mb-1 font-medium text-sm">{t("admin.orders.columns.method")}</p><CustomSelect className="w-40" onChange={setDeliveryMethod} options={methodOptions} value={deliveryMethod} /></div><label className="flex flex-col gap-1"><span className="font-medium text-sm">{t("admin.orders.filter.date")}</span><Input className="w-44" onChange={event => setDate(event.currentTarget.value)} type="date" value={date} /></label></div>
		{isPending ? <Skeleton className="h-40 w-full" /> : isError ? <ErrorState title={t("admin.orders.loadError")} /> : <OrdersKanban orders={orders} statuses={visibleStatuses} />}
	</Container>;
}
export const Route = createFileRoute("/admin/orders/")({ component: OrdersPage });