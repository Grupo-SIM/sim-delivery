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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { verticalListModifiers } from "@/lib/dnd-modifiers";
import { AddOptionModal } from "./AddOptionModal";
import { type EditableOption, OptionEditor } from "./OptionEditor";
import { OptionGroupCard } from "./OptionGroupCard";
import type { ProductOptionActions } from "./use-product-option-actions";

export interface OptionGroup {
	allowRepeatSelection: boolean;
	id: string;
	maxSelect: number | null;
	name: string;
	options: EditableOption[];
	priceRule: "sum" | "highest" | "average";
	required: boolean;
	sortOrder: number;
}

interface OptionGroupEditorProps {
	group: OptionGroup;
	actions: ProductOptionActions;
}

export function OptionGroupEditor({ group, actions }: OptionGroupEditorProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const [draft, setDraft] = useState(group);
	const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
	const [name, setName] = useState(group.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
		id: group.id,
	});
	const optionSensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function moveOption({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id || actions.isSaving) return;
		const sourceIndex = group.options.findIndex(option => option.id === active.id);
		const targetIndex = group.options.findIndex(option => option.id === over.id);
		if (sourceIndex < 0 || targetIndex < 0) return;
		void actions.reorderOptions(group.id, arrayMove(group.options, sourceIndex, targetIndex));
	}
	async function save() {
		flushName();
		if (await actions.saveGroup({ ...draft, name: localName.trim() })) closeActiveModalHistory();
	}

	return (
		<div
			className={`transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<OptionGroupCard
				dragHandleProps={{ ...attributes, ...listeners }}
				name={group.name}
				onDelete={
					actions.isSaving
						? undefined
						: () => {
								void actions.deleteGroup(group.id);
							}
				}
				onEdit={() => {
					setDraft(group);
					setName(group.name);
					setLocalName(group.name);
					setIsExpanded(true);
				}}
				optionCount={group.options.length}
			/>
			<Modal
				isOpen={isExpanded}
				maxWidth="640px"
				onClose={() => setIsExpanded(false)}
				title={t("admin.products.options.editGroup")}
				urlKey="product-option-group-edit"
				urlState={group.id}
			>
				<div className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2">
						<Label>
							<span>
								{t("admin.products.options.groupName")} <RequiredMark />
							</span>
							<Input
								className="text-foreground"
								onBlur={() => {
									flushName();
									setDraft({ ...draft, name: localName });
								}}
								onChange={event => setLocalName(event.currentTarget.value)}
								placeholder={t("admin.products.options.groupPlaceholder")}
								value={localName}
							/>
						</Label>
						<div className="flex items-center gap-2 md:col-span-2">
							<Checkbox
								aria-label={t("admin.products.options.required")}
								checked={draft.required}
								onChange={() => setDraft({ ...draft, required: !draft.required })}
							/>
							<span>{t("admin.products.options.required")}</span>
						</div>
						<div className="space-y-3 md:col-span-2">
							<div className="flex flex-wrap items-end gap-4">
								<Label>
									<span className="text-muted-foreground">{t("admin.products.options.max")}</span>
									<NumericInput
										className="w-32"
										decimalScale={0}
										onValueChange={({ floatValue }) => setDraft({ ...draft, maxSelect: floatValue ?? null })}
										placeholder={t("admin.products.options.unlimited")}
										value={draft.maxSelect}
									/>
								</Label>
								{draft.maxSelect !== 1 && (
									<Label className="w-52">
										<span>{t("admin.products.options.priceRule")}</span>
										<CustomSelect
											onChange={priceRule =>
												setDraft({ ...draft, priceRule: priceRule as OptionGroup["priceRule"] })
											}
											options={[
												{ label: t("admin.products.options.sum"), value: "sum" },
												{ label: t("admin.products.options.highest"), value: "highest" },
												{ label: t("admin.products.options.average"), value: "average" },
											]}
											value={draft.priceRule}
										/>
									</Label>
								)}
							</div>
							{draft.maxSelect !== 1 && (
								<div className="flex items-center gap-2">
									<Checkbox
										aria-label={t("admin.products.options.allowRepeatSelection")}
										checked={draft.allowRepeatSelection}
										onChange={() =>
											setDraft({ ...draft, allowRepeatSelection: !draft.allowRepeatSelection })
										}
									/>
									<span>{t("admin.products.options.allowRepeatSelection")}</span>
								</div>
							)}
						</div>
					</div>
					{group.options.length > 0 && (
						<>
							<div className="flex items-center justify-between border-border border-t pt-4">
								<p className="font-medium text-sm">{t("admin.products.options.optionList")}</p>
								<Button
									onClick={() => setIsOptionsExpanded(current => !current)}
									type="button"
									variant="outline"
								>
									{isOptionsExpanded ? (
										<LuChevronUp className="h-4 w-4" />
									) : (
										<LuChevronDown className="h-4 w-4" />
									)}
									{isOptionsExpanded
										? t("admin.products.options.minimize")
										: t("admin.products.options.expand")}
								</Button>
							</div>
							{isOptionsExpanded && (
								<DndContext
									collisionDetection={closestCenter}
									modifiers={verticalListModifiers}
									onDragEnd={moveOption}
									sensors={optionSensors}
								>
									<SortableContext items={group.options} strategy={verticalListSortingStrategy}>
										<ScrollArea className="max-h-[30rem] space-y-2 overflow-y-auto overflow-x-hidden pr-1">
											{group.options.map(option => (
												<OptionEditor
													isSaving={actions.isSaving}
													key={option.id}
													onDelete={() => {
														void actions.deleteOption(group.id, option.id);
													}}
													onSave={value => actions.saveOption(group.id, value)}
													option={option}
												/>
											))}
										</ScrollArea>
									</SortableContext>
								</DndContext>
							)}
						</>
					)}
					<div className="border-border border-t pt-4">
						<AddOptionModal
							isSaving={actions.isSaving}
							onAdd={option => actions.addOption(group.id, { ...option, sortOrder: group.options.length })}
						/>
					</div>
					<div className="flex justify-end gap-2">
						<ConfirmActionButton
							confirmation={t("admin.products.options.deleteGroupConfirm")}
							confirmLabel={t("admin.products.options.delete")}
							disabled={actions.isSaving}
							onConfirm={() =>
								closeActiveModalHistory(() => {
									void actions.deleteGroup(group.id);
								})
							}
							type="button"
							variant="outline"
						>
							{t("admin.products.options.delete")}
						</ConfirmActionButton>
						<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">
							{t("admin.products.options.discardChanges")}
						</Button>
						<Button
							disabled={actions.isSaving || !localName.trim()}
							onClick={() => void save()}
							type="button"
						>
							{t("admin.products.edit.save")}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
