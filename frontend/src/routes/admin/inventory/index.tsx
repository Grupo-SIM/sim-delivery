import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	LuArrowDownToLine,
	LuArrowRight,
	LuArrowUpFromLine,
	LuChevronDown,
	LuPackagePlus,
	LuPlus,
	LuTrash2,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { Tooltip } from "@/components/ui/Tooltip";
import {
	type GetInventoryOverview200,
	getInventoryItemsQueryKey,
	getInventoryOverviewQueryKey,
	useGetInventoryOverview,
	useGetUnits,
	usePatchInventoryItemsByItemId,
} from "@/lib/api";
import { canAccessAllUnits, canManageInventory } from "@/lib/staff-guard";
import { cn } from "@/lib/utils";
import { showAlert, showToast, useAuthStore } from "@/stores";
import { CreateInventoryItemModal, InventoryMovementModal } from "./components";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

type InventoryOverviewItem = GetInventoryOverview200["items"][number];

export interface InventoryItemGroup {
	inventoryItemId: string;
	inventoryItemName: string;
	items: InventoryOverviewItem[];
	unit: InventoryOverviewItem["unit"];
}

export function groupInventoryItems(items: InventoryOverviewItem[]): InventoryItemGroup[] {
	const groups = new Map<string, InventoryItemGroup>();
	for (const item of items) {
		const group = groups.get(item.inventoryItemId);
		if (group) group.items.push(item);
		else {
			groups.set(item.inventoryItemId, {
				inventoryItemId: item.inventoryItemId,
				inventoryItemName: item.inventoryItemName,
				items: [item],
				unit: item.unit,
			});
		}
	}
	return [...groups.values()];
}

function InventoryPage() {
	const { t } = useTranslation();
	const role = useAuthStore(state => state.role);
	const canManage = canManageInventory(role);
	const canViewAllUnits = canAccessAllUnits(role);
	const queryClient = useQueryClient();
	const [unitId, setUnitId] = useState("");
	const [status, setStatus] = useState<"all" | "low" | "negative" | "no_history">("all");
	const [search, setSearch] = useState("");
	const [itemOpen, setItemOpen] = useState(false);
	const [movementOpen, setMovementOpen] = useState(false);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
	const [quickMovement, setQuickMovement] = useState<{
		inventoryItemId: string;
		type: "entry" | "loss";
		unitId: string;
	} | null>(null);
	const { data: units = [] } = useGetUnits();

	useEffect(() => {
		if (canViewAllUnits || units.length === 0 || units.some(unit => unit.id === unitId)) return;
		setUnitId(units[0].id);
	}, [canViewAllUnits, unitId, units]);
	const { data, isError, isPending } = useGetInventoryOverview({
		search: search || undefined,
		status,
		unitId: unitId || undefined,
	});
	const deactivate = usePatchInventoryItemsByItemId();
	const itemGroups = useMemo(() => groupInventoryItems(data?.items ?? []), [data?.items]);

	function toggleItem(inventoryItemId: string) {
		setExpandedItems(current => {
			const next = new Set(current);
			if (next.has(inventoryItemId)) next.delete(inventoryItemId);
			else next.add(inventoryItemId);
			return next;
		});
	}

	function deactivateItem(inventoryItemId: string) {
		deactivate.mutate(
			{ data: { active: false }, itemId: inventoryItemId },
			{
				onError: () => void showAlert(t("admin.inventory.item.deleteError")),
				onSuccess: () => {
					setExpandedItems(current => {
						const next = new Set(current);
						next.delete(inventoryItemId);
						return next;
					});
					void queryClient.invalidateQueries({ queryKey: getInventoryItemsQueryKey() });
					void queryClient.invalidateQueries({ queryKey: getInventoryOverviewQueryKey() });
					showToast(t("admin.inventory.item.deleteSuccess"), "positive");
				},
			},
		);
	}

	return (
		<Container className="space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<SectionHeading subtitle={t("admin.inventory.subtitle")} title={t("admin.inventory.title")} />
				{canManage && (
					<div className="flex gap-2">
						<Button onClick={() => setItemOpen(true)} type="button" variant="outline">
							<LuPackagePlus />
							{t("admin.inventory.addItem")}
						</Button>
						<Button onClick={() => setMovementOpen(true)} type="button">
							<LuPlus />
							{t("admin.inventory.addMovement")}
						</Button>
					</div>
				)}
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				<TextField
					label={t("admin.inventory.filters.search")}
					onValueChange={setSearch}
					placeholder="Ex: Farinha"
					value={search}
				/>
				<div>
					<span className="mb-1 block font-medium text-sm">{t("admin.inventory.filters.unit")}</span>
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
					<span className="mb-1 block font-medium text-sm">{t("admin.inventory.filters.status")}</span>
					<CustomSelect
						onChange={value => setStatus(value as typeof status)}
						options={[
							{ label: t("admin.inventory.status.all"), value: "all" },
							{ label: t("admin.inventory.status.low"), value: "low" },
							{ label: t("admin.inventory.status.negative"), value: "negative" },
							{ label: t("admin.inventory.status.no_history"), value: "no_history" },
						]}
						value={status}
					/>
				</div>
			</div>
			<Link
				className="inline-flex items-center gap-2 font-medium text-primary text-sm"
				to="/admin/inventory/movements"
			>
				{t("admin.inventory.viewMovements")}
				<LuArrowRight />
			</Link>
			{isPending ? (
				<Skeleton className="h-64" />
			) : isError ? (
				<ErrorState title={t("admin.inventory.loadError")} />
			) : itemGroups.length === 0 ? (
				<EmptyState title={t("admin.inventory.empty")} />
			) : (
				<DataTable tableClassName="table-fixed">
					<colgroup>
						<col className="w-[19%]" />
						<col className="w-[15%]" />
						<col className="w-[15%]" />
						<col className="w-[14%]" />
						<col className="w-[15%]" />
						<col />
						<col className="w-28" />
					</colgroup>
					<thead>
						<tr className="border-b text-left">
							<th className="px-4 py-3">{t("admin.inventory.columns.item")}</th>
							<th className="px-4 py-3">{t("admin.inventory.columns.unit")}</th>
							<th className="px-4 py-3 text-right">{t("admin.inventory.columns.available")}</th>
							<th className="px-4 py-3 text-right">{t("admin.inventory.columns.reserved")}</th>
							<th className="px-4 py-3 text-right">{t("admin.inventory.columns.cost")}</th>
							<th className="px-4 py-3 text-right">{t("admin.inventory.columns.coverage")}</th>
							<th className="px-4 py-3">
								<span className="sr-only">{t("admin.inventory.columns.actions")}</span>
							</th>
						</tr>
					</thead>
					{itemGroups.map(group => {
						const isOpen = expandedItems.has(group.inventoryItemId);
						const contentId = `inventory-units-${group.inventoryItemId}`;
						return (
							<Fragment key={group.inventoryItemId}>
								<tbody>
									<tr className="border-b bg-muted/30">
										<td className="p-0" colSpan={7}>
											<div className="flex items-center gap-2 px-4 py-2">
												<button
													aria-controls={contentId}
													aria-expanded={isOpen}
													className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
													onClick={() => toggleItem(group.inventoryItemId)}
													type="button"
												>
													<LuChevronDown
														className={cn("size-5 shrink-0 transition-transform", isOpen && "rotate-180")}
													/>
													<span className="truncate font-semibold">{group.inventoryItemName}</span>
													<span className="text-muted-foreground text-sm">
														{t(`admin.inventory.units.${group.unit}`)} ·{" "}
														{group.items.length === 1
															? t("admin.inventory.item.unitCount_one", { count: group.items.length })
															: t("admin.inventory.item.unitCount_other", { count: group.items.length })}
													</span>
												</button>
										{canManage && (
											<ConfirmActionButton
												aria-label={t("admin.inventory.item.delete")}
												confirmation={t("admin.inventory.item.deleteConfirm", {
													name: group.inventoryItemName,
												})}
												confirmLabel={t("admin.inventory.item.delete")}
												disabled={deactivate.isPending}
												idleIcon={<LuTrash2 className="size-4" />}
												onConfirm={() => deactivateItem(group.inventoryItemId)}
												size="icon"
												type="button"
												variant="outline"
											>
												{null}
											</ConfirmActionButton>
										)}
											</div>
										</td>
									</tr>
								</tbody>
								{isOpen && (
									<tbody id={contentId}>
										{group.items.map(item => (
											<tr className="border-b last:border-b-0" key={`${item.unitId}:${item.inventoryItemId}`}>
												<td className="px-4 py-3 pl-12 text-muted-foreground">{group.inventoryItemName}</td>
												<td className="px-4 py-3 font-medium">{item.unitName}</td>
												<td className="px-4 py-3 text-right">
													{quantity.format(item.quantity - item.reservedQuantity)}
												</td>
												<td className="px-4 py-3 text-right">{quantity.format(item.reservedQuantity)}</td>
												<td className="px-4 py-3 text-right">{money.format(item.averageCostCents / 100)}</td>
												<td className="px-4 py-3 text-right">
													{item.coverageDays === null
														? t("admin.inventory.noHistory")
														: t("admin.inventory.days", {
																count: Math.max(0, Math.floor(item.coverageDays)),
															})}
												</td>
												<td className="px-4 py-3">
													{canManage && (
														<div className="flex min-w-max justify-end gap-2">
														<Tooltip content={t("admin.inventory.actions.registerEntry")}>
															<Button
																aria-label={t("admin.inventory.actions.registerEntry")}
																onClick={() =>
																	setQuickMovement({
																		inventoryItemId: item.inventoryItemId,
																		type: "entry",
																		unitId: item.unitId,
																	})
																}
																size="icon"
																type="button"
																variant="outline"
															>
																<LuArrowDownToLine />
															</Button>
														</Tooltip>
														<Tooltip content={t("admin.inventory.actions.registerLoss")}>
															<Button
																aria-label={t("admin.inventory.actions.registerLoss")}
																onClick={() =>
																	setQuickMovement({
																		inventoryItemId: item.inventoryItemId,
																		type: "loss",
																		unitId: item.unitId,
																	})
																}
																size="icon"
																type="button"
																variant="outline"
															>
																<LuArrowUpFromLine />
															</Button>
														</Tooltip>
														</div>
													)}
												</td>
											</tr>
										))}
									</tbody>
								)}
							</Fragment>
						);
					})}
				</DataTable>
			)}
			{canManage && (
				<>
					<CreateInventoryItemModal isOpen={itemOpen} onClose={() => setItemOpen(false)} />
					<InventoryMovementModal isOpen={movementOpen} onClose={() => setMovementOpen(false)} />
					<InventoryMovementModal
						initialInventoryItemId={quickMovement?.inventoryItemId}
						initialType={quickMovement?.type}
						initialUnitId={quickMovement?.unitId}
						isOpen={quickMovement !== null}
						onClose={() => setQuickMovement(null)}
					/>
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/inventory/")({ component: InventoryPage });
