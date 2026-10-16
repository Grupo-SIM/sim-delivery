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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { verticalListModifiers } from "@/lib/dnd-modifiers";
import { OptionGroupEditor } from "./OptionGroupEditor";
import { OptionGroupPreviews } from "./OptionGroupPreviews";
import type { Product } from "./types";
import { useProductOptionActions } from "./use-product-option-actions";

interface ProductOptionsEditorProps {
	product: Product;
}

export function ProductOptionsEditor({ product }: ProductOptionsEditorProps) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const actions = useProductOptionActions(product.id);
	const groupSensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	async function addGroup() {
		if (!localName.trim()) return;
		if (await actions.addGroup(localName.trim())) setLocalName("");
	}
	function moveGroup({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id || actions.isSaving) return;
		const sourceIndex = actions.groups.findIndex(group => group.id === active.id);
		const targetIndex = actions.groups.findIndex(group => group.id === over.id);
		if (sourceIndex < 0 || targetIndex < 0) return;
		void actions.reorderGroups(arrayMove(actions.groups, sourceIndex, targetIndex));
	}
	return (
		<div className="space-y-4 border-border border-t pt-4">
			<h3 className="font-semibold">{t("admin.products.options.title")}</h3>
			{actions.query.isPending ? (
				<OptionGroupPreviews groups={product.optionGroups} pending />
			) : actions.query.isError ? (
				<p className="text-destructive text-xs">{t("admin.products.options.loadError")}</p>
			) : (
				<>
					<div className="flex gap-2">
						<Input
							onBlur={flushName}
							onChange={event => setLocalName(event.currentTarget.value)}
							placeholder={t("admin.products.options.groupPlaceholder")}
							value={localName}
						/>
						<Button
							className="shrink-0 px-4"
							disabled={actions.isSaving || !localName.trim()}
							onClick={() => void addGroup()}
							type="button"
						>
							{t("admin.products.options.addGroup")}
						</Button>
					</div>
					<DndContext
						collisionDetection={closestCenter}
						modifiers={verticalListModifiers}
						onDragEnd={moveGroup}
						sensors={groupSensors}
					>
						<SortableContext items={actions.groups} strategy={verticalListSortingStrategy}>
							{actions.groups.map(group => (
								<OptionGroupEditor actions={actions} group={group} key={group.id} />
							))}
						</SortableContext>
					</DndContext>
				</>
			)}
		</div>
	);
}
