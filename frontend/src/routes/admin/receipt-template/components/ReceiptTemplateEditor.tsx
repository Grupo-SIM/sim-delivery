import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { LuMinus, LuPlus, LuType } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { verticalListModifiers } from "@/lib/dnd-modifiers";
import { createBlockMeta, DYNAMIC_BLOCK_TYPES } from "./receipt-template";
import { ReceiptBlockRow } from "./ReceiptBlockRow";
import type { ReceiptBlock, ReceiptBlockType, ReceiptTemplate } from "./types";

interface ReceiptTemplateEditorProps {
	onChange: (template: ReceiptTemplate) => void;
	template: ReceiptTemplate;
}

function nextId(type: ReceiptBlockType): string {
	return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ReceiptTemplateEditor({ onChange, template }: ReceiptTemplateEditorProps) {
	const { t } = useTranslation();
	const meta = createBlockMeta(t);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const activeTypes = new Set(template.blocks.map(block => block.type));
	const availableDynamicBlocks = DYNAMIC_BLOCK_TYPES.filter(type => !activeTypes.has(type));

	function addBlock(type: ReceiptBlockType) {
		const block: ReceiptBlock = {
			...(type === "text"
				? { align: "center", bold: false, content: t("admin.receiptTemplate.text.defaultContent"), size: "normal" }
				: {}),
			id: nextId(type),
			type,
		};
		onChange({ blocks: [...template.blocks, block] });
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		const from = template.blocks.findIndex(block => block.id === active.id);
		const to = template.blocks.findIndex(block => block.id === over.id);
		if (from >= 0 && to >= 0) onChange({ blocks: arrayMove(template.blocks, from, to) });
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-5">
			<div className="shrink-0 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
				<p className="font-semibold text-sm">{t("admin.receiptTemplate.library.title")}</p>
				<p className="mt-1 text-muted-foreground text-xs">{t("admin.receiptTemplate.library.subtitle")}</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{availableDynamicBlocks.map(type => (
						<Button key={type} onClick={() => addBlock(type)} size="sm" type="button" variant="outline">
							<LuPlus className="size-4" />
							{meta[type].label}
						</Button>
					))}
					<Button onClick={() => addBlock("text")} size="sm" type="button" variant="outline">
						<LuType className="size-4" />
						{meta.text.label}
					</Button>
					<Button onClick={() => addBlock("separator")} size="sm" type="button" variant="outline">
						<LuMinus className="size-4" />
						{meta.separator.label}
					</Button>
				</div>
			</div>

			<ScrollArea className="min-h-0 flex-1 overflow-y-auto pr-2">
				<DndContext collisionDetection={closestCenter} modifiers={verticalListModifiers} onDragEnd={handleDragEnd} sensors={sensors}>
					<SortableContext items={template.blocks} strategy={verticalListSortingStrategy}>
						<div className="space-y-2">
							{template.blocks.map(block => (
								<ReceiptBlockRow
									block={block}
									key={block.id}
									meta={meta[block.type]}
									onChange={next => onChange({ blocks: template.blocks.map(item => item.id === block.id ? next : item) })}
									onRemove={() => onChange({ blocks: template.blocks.filter(item => item.id !== block.id) })}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			</ScrollArea>
		</div>
	);
}
