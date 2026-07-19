import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
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
}

export function OptionGroupEditor({ group, onChange, onDelete }: OptionGroupEditorProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(group.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [optionName, setOptionName] = useState("");
	const [localOptionName, setLocalOptionName, flushOptionName] = useDebouncedInput(optionName, setOptionName);
	function addOption() {
		flushOptionName();
		if (!optionName.trim()) return;
		onChange({ ...group, options: [...group.options, { available: true, description: "", id: crypto.randomUUID(), imageUrl: null, maxPerItem: null, name: optionName.trim(), priceDeltaCents: 0, sortOrder: group.options.length }] });
		setLocalOptionName("");
	}
	return (
		<section className="space-y-3 rounded border border-border p-3">
			<div className="grid gap-2 md:grid-cols-4">
				<Input
					onBlur={() => {
						flushName();
						onChange({ ...group, name: localName });
					}}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.products.options.groupPlaceholder")}
					value={localName}
				/>
				<NumericInput
					decimalScale={0}
			onValueChange={({ floatValue }) => onChange({ ...group, minSelect: floatValue ?? 0 })}
					placeholder="0"
					value={group.minSelect}
				/>
				<NumericInput
					decimalScale={0}
			onValueChange={({ floatValue }) => onChange({ ...group, maxSelect: floatValue ?? 1 })}
					placeholder="1"
					value={group.maxSelect}
				/>
				<CustomSelect
					onChange={selectionType =>
				onChange({ ...group, maxSelect: selectionType === "single" ? 1 : group.maxSelect, selectionType: selectionType as OptionGroup["selectionType"] })
					}
					options={[
						{ label: t("admin.products.options.single"), value: "single" },
						{ label: t("admin.products.options.multi"), value: "multi" },
					]}
					value={group.selectionType}
				/>
				<CustomSelect
			onChange={priceRule => onChange({ ...group, priceRule: priceRule as OptionGroup["priceRule"] })}
					options={[
						{ label: t("admin.products.options.sum"), value: "sum" },
						{ label: t("admin.products.options.highest"), value: "highest" },
						{ label: t("admin.products.options.average"), value: "average" },
					]}
					value={group.priceRule}
				/>
				<NumericInput
					decimalScale={0}
			onValueChange={({ floatValue }) => onChange({ ...group, sortOrder: floatValue ?? 0 })}
					placeholder="0"
					value={group.sortOrder}
				/>
				<ConfirmActionButton
					confirmation={t("admin.products.options.deleteGroupConfirm")}
					confirmLabel={t("admin.products.options.delete")}
			onConfirm={onDelete}
					type="button"
					variant="outline"
				>
					{t("admin.products.options.delete")}
				</ConfirmActionButton>
			</div>
			<div className="space-y-2">
				{group.options.map(option => (
					<OptionEditor
					key={option.id}
					onChange={value => onChange({ ...group, options: group.options.map(item => item.id === option.id ? value : item) })}
					onDelete={() => onChange({ ...group, options: group.options.filter(item => item.id !== option.id) })}
					option={option}
					/>
				))}
			</div>
			<div className="flex gap-2">
				<Input
					onBlur={flushOptionName}
					onChange={event => setLocalOptionName(event.currentTarget.value)}
					placeholder={t("admin.products.options.optionPlaceholder")}
					value={localOptionName}
				/>
				<Button disabled={!localOptionName.trim()} onClick={addOption} type="button" variant="outline">
					{t("admin.products.options.addOption")}
				</Button>
			</div>
		</section>
	);
}
