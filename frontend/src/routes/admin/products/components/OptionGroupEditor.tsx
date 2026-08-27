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
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { verticalListModifiers } from "@/lib/dnd-modifiers";
import { AddOptionModal } from "./AddOptionModal";
import { type EditableOption, OptionEditor } from "./OptionEditor";
import { OptionGroupCard } from "./OptionGroupCard";

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
	onChange: (group: OptionGroup) => void;
	onDelete: () => void;
}

export function OptionGroupEditor({ group, onChange, onDelete }: OptionGroupEditorProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const [originalGroup, setOriginalGroup] = useState<OptionGroup | null>(null);
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

	function addOption(option: EditableOption) {
		onChange({
			...group,
			options: [
				...group.options,
				{
					...option,
					sortOrder: group.options.length,
				},
			],
		});
	}

	function moveOption({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		const sourceIndex = group.options.findIndex(option => option.id === active.id);
		const targetIndex = group.options.findIndex(option => option.id === over.id);
		if (sourceIndex < 0 || targetIndex < 0) return;
		const options = arrayMove(group.options, sourceIndex, targetIndex);
		onChange({ ...group, options: options.map((option, index) => ({ ...option, sortOrder: index })) });
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
				onDelete={onDelete}
				onEdit={() => {
					setOriginalGroup(structuredClone(group));
					setIsExpanded(true);
				}}
				optionCount={group.options.length}
			/>
			<Modal
				isOpen={isExpanded}
				maxWidth="900px"
				onClose={() => {
					if (originalGroup) onChange(originalGroup);
					setIsExpanded(false);
				}}
				title={t("admin.products.options.editGroup")}
				urlKey="product-option-group-edit"
				urlState={group.id}
			>
				<div className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2">
						<Label>
							<span>{t("admin.products.options.groupName")}</span>
							<Input
								className="text-foreground"
								onBlur={() => {
									flushName();
									onChange({ ...group, name: localName });
								}}
								onChange={event => setLocalName(event.currentTarget.value)}
								placeholder={t("admin.products.options.groupPlaceholder")}
								value={localName}
							/>
						</Label>
						<div className="flex items-center gap-2 md:col-span-2">
							<Checkbox
								aria-label={t("admin.products.options.required")}
								checked={group.required}
								onChange={() => onChange({ ...group, required: !group.required })}
							/>
							<span>{t("admin.products.options.required")}</span>
						</div>
						<div className="space-y-3 md:col-span-2">
							<div className="flex flex-wrap items-end gap-4">
								<Label>
									<span className="text-muted-foreground">{t("admin.products.options.max")}</span>
									<NumericInput
										className="w-20"
										decimalScale={0}
										onValueChange={({ floatValue }) => onChange({ ...group, maxSelect: floatValue ?? null })}
										placeholder={t("admin.products.options.unlimited")}
										value={group.maxSelect}
									/>
								</Label>
								{group.maxSelect !== 1 && (
									<>
										<div className="flex items-center gap-2 pb-2">
											<Checkbox
												aria-label={t("admin.products.options.allowRepeatSelection")}
												checked={group.allowRepeatSelection}
												onChange={() =>
													onChange({ ...group, allowRepeatSelection: !group.allowRepeatSelection })
												}
											/>
											<span>{t("admin.products.options.allowRepeatSelection")}</span>
										</div>
										<Label className="w-52">
											<span>{t("admin.products.options.priceRule")}</span>
											<CustomSelect
												onChange={priceRule =>
													onChange({ ...group, priceRule: priceRule as OptionGroup["priceRule"] })
												}
												options={[
													{ label: t("admin.products.options.sum"), value: "sum" },
													{ label: t("admin.products.options.highest"), value: "highest" },
													{ label: t("admin.products.options.average"), value: "average" },
												]}
												value={group.priceRule}
											/>
										</Label>
									</>
								)}
							</div>
							<p className="text-muted-foreground text-xs">{t("admin.products.options.maxHelp")}</p>
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
													key={option.id}
													onChange={value =>
														onChange({
															...group,
															options: group.options.map(item => (item.id === option.id ? value : item)),
														})
													}
													onDelete={() =>
														onChange({
															...group,
															options: group.options.filter(item => item.id !== option.id),
														})
													}
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
						<AddOptionModal onAdd={addOption} />
					</div>
					<p className="text-muted-foreground text-xs">{t("admin.products.options.draftChangesHint")}</p>
					<div className="flex justify-end gap-2">
						<ConfirmActionButton
							confirmation={t("admin.products.options.deleteGroupConfirm")}
							confirmLabel={t("admin.products.options.delete")}
							onConfirm={onDelete}
							type="button"
							variant="outline"
						>
							{t("admin.products.options.delete")}
						</ConfirmActionButton>
						<Button
							onClick={() => {
								if (originalGroup) onChange(originalGroup);
								setIsExpanded(false);
							}}
							type="button"
							variant="outline"
						>
							{t("admin.products.options.discardChanges")}
						</Button>
						<Button onClick={() => setIsExpanded(false)} type="button">
							{t("admin.products.options.finishEditing")}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
