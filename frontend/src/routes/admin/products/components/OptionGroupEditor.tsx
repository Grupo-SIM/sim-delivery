import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuChevronUp, LuGripVertical } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type EditableOption, OptionEditor } from "./OptionEditor";

export interface OptionGroup {
	id: string;
	maxSelect: number;
	minSelect: number;
	name: string;
	options: EditableOption[];
	priceRule: "sum" | "highest" | "average";
	selectionType: "single" | "multi";
	sortOrder: number;
}

interface OptionGroupEditorProps {
	group: OptionGroup;
	onChange: (group: OptionGroup) => void;
	onDelete: () => void;
	onDragEnd: () => void;
	onDragOver: (event: DragEvent<HTMLElement>) => void;
	onDragStart: () => void;
	onDrop: () => void;
}

export function OptionGroupEditor({
	group,
	onChange,
	onDelete,
	onDragEnd,
	onDragOver,
	onDragStart,
	onDrop,
}: OptionGroupEditorProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
	const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);
	const [wasExpandedBeforeDrag, setWasExpandedBeforeDrag] = useState(false);
	const [name, setName] = useState(group.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [optionName, setOptionName, flushOptionName] = useDebouncedInput("", () => undefined);

	function addOption() {
		flushOptionName();
		if (!optionName.trim()) return;
		onChange({
			...group,
			options: [
				...group.options,
				{
					available: true,
					description: "",
					id: crypto.randomUUID(),
					imageUrl: null,
					maxPerItem: null,
					name: optionName.trim(),
					priceDeltaCents: 0,
					sortOrder: group.options.length,
				},
			],
		});
		setOptionName("");
	}

	function moveOption(targetId: string) {
		if (!draggedOptionId || draggedOptionId === targetId) return;
		const sourceIndex = group.options.findIndex(option => option.id === draggedOptionId);
		const targetIndex = group.options.findIndex(option => option.id === targetId);
		if (sourceIndex < 0 || targetIndex < 0) return;
		const options = [...group.options];
		const [moved] = options.splice(sourceIndex, 1);
		options.splice(targetIndex, 0, moved);
		onChange({ ...group, options: options.map((option, index) => ({ ...option, sortOrder: index })) });
		setDraggedOptionId(null);
	}

	return (
		<div
			className="overflow-hidden rounded-lg border border-border bg-surface"
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<div className="flex items-center justify-between gap-3 border-border border-b bg-muted/30 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<button
						aria-label={t("admin.products.options.reorder")}
						className="cursor-grab text-muted-foreground active:cursor-grabbing"
						draggable
						onDragEnd={() => {
							if (wasExpandedBeforeDrag) setIsExpanded(true);
							setWasExpandedBeforeDrag(false);
							onDragEnd();
						}}
						onDragStart={event => {
							event.dataTransfer.effectAllowed = "move";
							event.dataTransfer.setData("text/plain", group.id);
							setWasExpandedBeforeDrag(isExpanded);
							setIsExpanded(false);
							onDragStart();
						}}
						type="button"
					>
						<LuGripVertical className="h-5 w-5" />
					</button>
					<div className="min-w-0">
						<p className="truncate font-semibold">{group.name}</p>
						<p className="text-muted-foreground text-sm">
							{group.options.length === 1
								? t("admin.products.options.optionCount_one", { count: group.options.length })
								: t("admin.products.options.optionCount_other", { count: group.options.length })}
						</p>
					</div>
				</div>
				<Button
					aria-expanded={isExpanded}
					onClick={() => setIsExpanded(current => !current)}
					type="button"
					variant="outline"
				>
					{isExpanded ? <LuChevronUp className="h-4 w-4" /> : <LuChevronDown className="h-4 w-4" />}
					{isExpanded ? t("admin.products.options.collapse") : t("admin.products.options.expand")}
				</Button>
			</div>
			{isExpanded && (
				<div className="space-y-4 p-4">
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						<Label>
							<span>{t("admin.products.options.groupName")}</span>
							<Input
								onBlur={() => {
									flushName();
									onChange({ ...group, name: localName });
								}}
								onChange={event => setLocalName(event.currentTarget.value)}
								placeholder={t("admin.products.options.groupPlaceholder")}
								value={localName}
							/>
						</Label>
						<Label>
							<span>{t("admin.products.options.minSelect")}</span>
							<NumericInput
								decimalScale={0}
								onValueChange={({ floatValue }) => onChange({ ...group, minSelect: floatValue ?? 0 })}
								placeholder="0"
								value={group.minSelect}
							/>
						</Label>
						<Label>
							<span>{t("admin.products.options.maxSelect")}</span>
							<NumericInput
								decimalScale={0}
								onValueChange={({ floatValue }) => onChange({ ...group, maxSelect: floatValue ?? 1 })}
								placeholder="1"
								value={group.maxSelect}
							/>
						</Label>
						<Label>
							<span>{t("admin.products.options.selectionType")}</span>
							<CustomSelect
								onChange={selectionType =>
									onChange({
										...group,
										maxSelect: selectionType === "single" ? 1 : group.maxSelect,
										selectionType: selectionType as OptionGroup["selectionType"],
									})
								}
								options={[
									{ label: t("admin.products.options.single"), value: "single" },
									{ label: t("admin.products.options.multi"), value: "multi" },
								]}
								value={group.selectionType}
							/>
						</Label>
						<Label>
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
					</div>
					<ConfirmActionButton
						confirmation={t("admin.products.options.deleteGroupConfirm")}
						confirmLabel={t("admin.products.options.delete")}
						onConfirm={onDelete}
						type="button"
						variant="outline"
					>
						{t("admin.products.options.delete")}
					</ConfirmActionButton>
					<div className="flex items-center justify-between border-border border-t pt-4">
						<p className="font-medium text-sm">{t("admin.products.options.optionList")}</p>
						<Button onClick={() => setIsOptionsExpanded(current => !current)} type="button" variant="outline">
							{isOptionsExpanded ? (
								<LuChevronUp className="h-4 w-4" />
							) : (
								<LuChevronDown className="h-4 w-4" />
							)}
							{isOptionsExpanded
								? t("admin.products.options.collapseOptions")
								: t("admin.products.options.expandOptions")}
						</Button>
					</div>
					{isOptionsExpanded && (
						<div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
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
										onChange({ ...group, options: group.options.filter(item => item.id !== option.id) })
									}
									onDragEnd={() => setDraggedOptionId(null)}
									onDragOver={event => event.preventDefault()}
									onDragStart={() => setDraggedOptionId(option.id)}
									onDrop={() => moveOption(option.id)}
									option={option}
								/>
							))}
						</div>
					)}
					<div className="flex gap-2 border-border border-t pt-4">
						<Input
							onBlur={flushOptionName}
							onChange={event => setOptionName(event.currentTarget.value)}
							placeholder={t("admin.products.options.optionPlaceholder")}
							value={optionName}
						/>
						<Button disabled={!optionName.trim()} onClick={addOption} type="button" variant="outline">
							{t("admin.products.options.addOption")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
