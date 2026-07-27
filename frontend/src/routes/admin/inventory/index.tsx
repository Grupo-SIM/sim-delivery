import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuPackagePlus, LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetInventoryOverview, useGetUnits } from "@/lib/api";
import { CreateInventoryItemModal, InventoryMovementModal } from "./components";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

function InventoryPage() {
	const { t } = useTranslation();
	const [unitId, setUnitId] = useState("");
	const [status, setStatus] = useState<"all" | "low" | "negative" | "no_history">("all");
	const [search, setSearch] = useState("");
	const [itemOpen, setItemOpen] = useState(false);
	const [movementOpen, setMovementOpen] = useState(false);
	const { data: units = [] } = useGetUnits();
	const { data, isError, isPending } = useGetInventoryOverview({ search: search || undefined, status, unitId: unitId || undefined });
	return <Container className="space-y-6 py-8">
		<div className="flex flex-wrap items-start justify-between gap-3"><SectionHeading subtitle={t("admin.inventory.subtitle")} title={t("admin.inventory.title")} /><div className="flex gap-2"><Button onClick={() => setItemOpen(true)} type="button" variant="outline"><LuPackagePlus />{t("admin.inventory.addItem")}</Button><Button onClick={() => setMovementOpen(true)} type="button"><LuPlus />{t("admin.inventory.addMovement")}</Button></div></div>
		<div className="grid gap-3 md:grid-cols-3"><TextField label={t("admin.inventory.filters.search")} onValueChange={setSearch} placeholder="Ex: Farinha" value={search} /><div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.filters.unit")}</span><CustomSelect onChange={setUnitId} options={[{ label: t("admin.inventory.filters.allUnits"), value: "" }, ...units.map(unit => ({ label: unit.name, value: unit.id }))]} value={unitId} /></div><div><span className="mb-1 block font-medium text-sm">{t("admin.inventory.filters.status")}</span><CustomSelect onChange={value => setStatus(value as typeof status)} options={[{ label: t("admin.inventory.status.all"), value: "all" }, { label: t("admin.inventory.status.low"), value: "low" }, { label: t("admin.inventory.status.negative"), value: "negative" }, { label: t("admin.inventory.status.no_history"), value: "no_history" }]} value={status} /></div></div>
		<Link className="inline-flex items-center gap-2 font-medium text-primary text-sm" to="/admin/inventory/movements">{t("admin.inventory.viewMovements")}<LuArrowRight /></Link>
		{isPending ? <Skeleton className="h-64" /> : isError ? <ErrorState title={t("admin.inventory.loadError")} /> : data.items.length === 0 ? <EmptyState title={t("admin.inventory.empty")} /> : <DataTable><thead><tr className="border-b text-left"><th className="px-4 py-3">{t("admin.inventory.columns.item")}</th><th className="px-4 py-3">{t("admin.inventory.columns.unit")}</th><th className="px-4 py-3 text-right">{t("admin.inventory.columns.available")}</th><th className="px-4 py-3 text-right">{t("admin.inventory.columns.reserved")}</th><th className="px-4 py-3 text-right">{t("admin.inventory.columns.cost")}</th><th className="px-4 py-3 text-right">{t("admin.inventory.columns.coverage")}</th></tr></thead><tbody>{data.items.map(item => <tr className={item.alert ? "border-b bg-destructive/5" : "border-b"} key={`${item.unitId}:${item.inventoryItemId}`}><td className="px-4 py-3 font-medium">{item.inventoryItemName}</td><td className="px-4 py-3">{item.unitName}</td><td className="px-4 py-3 text-right">{quantity.format(item.quantity - item.reservedQuantity)}</td><td className="px-4 py-3 text-right">{quantity.format(item.reservedQuantity)}</td><td className="px-4 py-3 text-right">{money.format(item.averageCostCents / 100)}</td><td className="px-4 py-3 text-right">{item.coverageDays === null ? t("admin.inventory.noHistory") : t("admin.inventory.days", { count: Math.max(0, Math.floor(item.coverageDays)) })}</td></tr>)}</tbody></DataTable>}
		<CreateInventoryItemModal isOpen={itemOpen} onClose={() => setItemOpen(false)} /><InventoryMovementModal isOpen={movementOpen} onClose={() => setMovementOpen(false)} />
	</Container>;
}

export const Route = createFileRoute("/admin/inventory/")({ component: InventoryPage });
