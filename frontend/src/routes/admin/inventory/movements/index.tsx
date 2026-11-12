import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuArrowLeft, LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetInventoryItems, useGetInventoryMovements, useGetUnits } from "@/lib/api";
import { canAccessAllUnits, canManageInventory } from "@/lib/staff-guard";
import { useAuthStore } from "@/stores";
import { InventoryMovementModal } from "../components";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3, signDisplay: "always" });
function MovementsPage() {
	const { t } = useTranslation();
	const role = useAuthStore(state => state.role);
	const canManage = canManageInventory(role);
	const canViewAllUnits = canAccessAllUnits(role);
	const [unitId, setUnitId] = useState("");
	const [inventoryItemId, setInventoryItemId] = useState("");
	const [type, setType] = useState("");
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const { data: units = [] } = useGetUnits();
	useEffect(() => {
		if (canViewAllUnits || units.length === 0 || units.some(unit => unit.id === unitId)) return;
		setUnitId(units[0].id);
	}, [canViewAllUnits, unitId, units]);
	const { data: items = [] } = useGetInventoryItems();
	const {
		data: movements = [],
		isError,
		isPending,
	} = useGetInventoryMovements({
		inventoryItemId: inventoryItemId || undefined,
		search: search || undefined,
		type: type ? (type as "entry" | "adjustment" | "loss") : undefined,
		unitId: unitId || undefined,
	});
	return (
		<Container className="space-y-6 py-8">
			<Link className="inline-flex items-center gap-2 text-muted-foreground text-sm" to="/admin/inventory">
				<LuArrowLeft />
				{t("admin.inventory.back")}
			</Link>
			<div className="flex justify-between gap-3">
				<SectionHeading
					subtitle={t("admin.inventory.movementsSubtitle")}
					title={t("admin.inventory.movementsTitle")}
				/>
				{canManage && (
					<Button onClick={() => setOpen(true)} type="button">
						<LuPlus />
						{t("admin.inventory.addMovement")}
					</Button>
				)}
			</div>
			<div className="grid gap-3 md:grid-cols-4">
				<TextField
					label={t("admin.inventory.filters.search")}
					onValueChange={setSearch}
					placeholder="Ex: Compra"
					value={search}
				/>
				<div>
					<span className="mb-1 block text-sm">{t("admin.inventory.filters.unit")}</span>
					<CustomSelect
						onChange={setUnitId}
						options={[
							...(canViewAllUnits ? [{ label: t("admin.inventory.filters.allUnits"), value: "" }] : []),
							...units.map(unit => ({ label: unit.name, value: unit.id })),
						]}
						value={unitId}
					/>
				</div>
				<div>
					<span className="mb-1 block text-sm">{t("admin.inventory.fields.item")}</span>
					<CustomSelect
						onChange={setInventoryItemId}
						options={[
							{ label: t("admin.inventory.filters.allItems"), value: "" },
							...items.map(item => ({ label: item.name, value: item.id })),
						]}
						value={inventoryItemId}
					/>
				</div>
				<div>
					<span className="mb-1 block text-sm">{t("admin.inventory.fields.type")}</span>
					<CustomSelect
						onChange={setType}
						options={[
							{ label: t("admin.inventory.filters.allTypes"), value: "" },
							{ label: t("admin.inventory.types.entry"), value: "entry" },
							{ label: t("admin.inventory.types.loss"), value: "loss" },
							{ label: t("admin.inventory.types.adjustment"), value: "adjustment" },
						]}
						value={type}
					/>
				</div>
			</div>
			{isPending ? (
				<Skeleton className="h-64" />
			) : isError ? (
				<ErrorState title={t("admin.inventory.loadError")} />
			) : movements.length === 0 ? (
				<EmptyState title={t("admin.inventory.emptyMovements")} />
			) : (
				<DataTable>
					<thead>
						<tr className="border-b text-left">
							<th className="px-4 py-3">{t("admin.inventory.columns.date")}</th>
							<th className="px-4 py-3">{t("admin.inventory.columns.item")}</th>
							<th className="px-4 py-3">{t("admin.inventory.columns.unit")}</th>
							<th className="px-4 py-3">{t("admin.inventory.fields.type")}</th>
							<th className="px-4 py-3">{t("admin.inventory.fields.reason")}</th>
							<th className="px-4 py-3 text-right">{t("admin.inventory.fields.quantity")}</th>
						</tr>
					</thead>
					<tbody>
						{movements.map(movement => (
							<tr className="border-b" key={movement.id}>
								<td className="px-4 py-3">{new Date(movement.createdAt).toLocaleString("pt-BR")}</td>
								<td className="px-4 py-3">{movement.inventoryItemName}</td>
								<td className="px-4 py-3">{movement.unitName}</td>
								<td className="px-4 py-3">
									{movement.type === "entry"
										? t("admin.inventory.types.entry")
										: movement.type === "adjustment"
											? t("admin.inventory.types.adjustment")
											: t("admin.inventory.types.loss")}
								</td>
								<td className="px-4 py-3">{movement.reason}</td>
								<td className="px-4 py-3 text-right">{number.format(movement.quantity)}</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			)}
			{canManage && <InventoryMovementModal isOpen={open} onClose={() => setOpen(false)} />}
		</Container>
	);
}
export const Route = createFileRoute("/admin/inventory/movements/")({ component: MovementsPage });
