import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/TextField";
import { type GetCategories200, getCategoriesQueryKey, usePutCategoriesOrder } from "@/lib/api";
import { verticalListModifiers } from "@/lib/dnd-modifiers";
import { showToast } from "@/stores";
import { CategoryRow } from "./CategoryRow";

interface CategoriesTableProps {
	canManage: boolean;
	canToggleAvailability: boolean;
	categories: GetCategories200;
	onSearchChange: (value: string) => void;
	search: string;
	visibleCategories?: GetCategories200;
}

export function CategoriesTable({
	canManage,
	canToggleAvailability,
	categories,
	onSearchChange,
	search,
	visibleCategories = categories,
}: CategoriesTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const reorder = usePutCategoriesOrder();
	const dragDisabled = !canManage || search.trim() !== "" || reorder.isPending;
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		const from = categories.findIndex(category => category.id === active.id);
		const to = categories.findIndex(category => category.id === over.id);
		if (from < 0 || to < 0) return;
		const categoryIds = arrayMove(categories, from, to).map(category => category.id);
		reorder.mutate(
			{ data: { categoryIds } },
			{
				onError: () => showToast(t("admin.categories.order.error"), "negative"),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });
					showToast(t("admin.categories.order.success"), "info");
				},
			},
		);
	}

	if (categories.length === 0) return <EmptyState title={t("admin.categories.empty")} />;

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					{canManage && <th className="px-2 py-3" />}
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.categories.columns.products")}</th>
					<th className="px-4 py-3 font-medium text-right">
						<TextField
							className="h-8"
							label={<span className="sr-only">{t("admin.categories.search.label")}</span>}
							onValueChange={onSearchChange}
							placeholder={t("admin.categories.search.placeholder")}
							value={search}
						/>
					</th>
				</tr>
			</thead>
			<DndContext
				collisionDetection={closestCenter}
				modifiers={verticalListModifiers}
				onDragEnd={handleDragEnd}
				sensors={sensors}
			>
				<SortableContext items={visibleCategories} strategy={verticalListSortingStrategy}>
					<tbody>
						{visibleCategories.length === 0 ? (
							<tr>
								<td
									className="px-4 py-6 text-center text-muted-foreground"
									colSpan={3 + (canManage ? 1 : 0)}
								>
									{t("admin.categories.searchEmpty")}
								</td>
							</tr>
						) : (
							visibleCategories.map(category => (
								<CategoryRow
									canManage={canManage}
									canToggleAvailability={canToggleAvailability}
									category={category}
									dragDisabled={dragDisabled}
									key={category.id}
								/>
							))
						)}
					</tbody>
				</SortableContext>
			</DndContext>
		</DataTable>
	);
}
