import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getUnitsByUnitIdCategoriesQueryKey,
	useGetUnitsByUnitIdCategories,
	usePutUnitsByUnitIdCategoriesOrder,
} from "@/lib/api";
import { showAlert } from "@/stores";
import { CategoryCard } from "./CategoryCard";

interface UnitCategoryColumnProps {
	onEdit: (category: { id: string; imageUrl: string; name: string }) => void;
	onLoaded: (unitId: string, categoryIds: string[]) => void;
	unitId: string;
	unitName: string;
}

export function UnitCategoryColumn({ onEdit, onLoaded, unitId, unitName }: UnitCategoryColumnProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data, isPending } = useGetUnitsByUnitIdCategories(unitId);
	const { mutate: reorder } = usePutUnitsByUnitIdCategoriesOrder();
	const [items, setItems] = useState<NonNullable<typeof data>>([]);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

	useEffect(() => {
		if (data) setItems(data);
	}, [data]);

	useEffect(() => {
		if (data)
			onLoaded(
				unitId,
				data.map(category => category.id),
			);
	}, [data, unitId, onLoaded]);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = items.findIndex(item => item.id === active.id);
		const newIndex = items.findIndex(item => item.id === over.id);
		const reordered = arrayMove(items, oldIndex, newIndex);
		setItems(reordered);
		reorder(
			{ data: { categoryIds: reordered.map(item => item.id) }, unitId },
			{
				onError: async () => {
					void showAlert(t("admin.categories.reorderError"));
					await queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdCategoriesQueryKey(unitId) });
				},
			},
		);
	}

	return (
		<div className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3">
			<h3 className="font-semibold text-sm">{unitName}</h3>

			{isPending ? (
				<Skeleton className="h-24 w-full" />
			) : items.length === 0 ? (
				<EmptyState title={t("admin.categories.empty")} />
			) : (
				<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
					<SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
						<div className="space-y-2">
							{items.map(item => (
								<CategoryCard category={item} key={item.id} onEdit={() => onEdit(item)} />
							))}
						</div>
					</SortableContext>
				</DndContext>
			)}
		</div>
	);
}
