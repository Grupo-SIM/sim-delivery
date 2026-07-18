import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	useDeleteProductsByProductIdOptionGroupsByGroupId,
	usePatchProductsByProductIdOptionGroupsByGroupId,
	usePostProductsByProductIdOptionGroupsByGroupIdOptions,
} from "@/lib/api";
import { showToast } from "@/stores";
import { type EditableOption, OptionEditor } from "./OptionEditor";

interface OptionGroup {
	id: string;
	maxSelect: number;
	minSelect: number;
	name: string;
	options: EditableOption[];
	priceRule: string;
	selectionType: string;
	sortOrder: number;
}

interface OptionGroupEditorProps {
	group: OptionGroup;
	onChange: () => void;
	productId: string;
}

export function OptionGroupEditor({ group, onChange, productId }: OptionGroupEditorProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(group.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [optionName, setOptionName] = useState("");
	const [localOptionName, setLocalOptionName, flushOptionName] = useDebouncedInput(optionName, setOptionName);
	const update = usePatchProductsByProductIdOptionGroupsByGroupId();
	const remove = useDeleteProductsByProductIdOptionGroupsByGroupId();
	const createOption = usePostProductsByProductIdOptionGroupsByGroupIdOptions();
	const save = (data: Record<string, unknown>) =>
		update.mutate(
			{ data, groupId: group.id, productId },
			{
				onSuccess: () => {
					onChange();
					showToast(t("admin.products.options.saved"), "positive");
				},
			},
		);
	function addOption() {
		flushOptionName();
		if (!optionName.trim()) return;
		createOption.mutate(
			{ data: { name: optionName.trim(), priceDeltaCents: 0 }, groupId: group.id, productId },
			{
				onSuccess: () => {
					setLocalOptionName("");
					onChange();
					showToast(t("admin.products.options.optionCreated"), "positive");
				},
			},
		);
	}
	return (
		<section className="space-y-3 rounded border border-border p-3">
			<div className="grid gap-2 md:grid-cols-4">
				<Input
					onBlur={() => {
						flushName();
						save({ name: localName });
					}}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.products.options.groupPlaceholder")}
					value={localName}
				/>
				<NumericInput
					decimalScale={0}
					onValueChange={({ floatValue }) => save({ minSelect: floatValue ?? 0 })}
					placeholder="0"
					value={group.minSelect}
				/>
				<NumericInput
					decimalScale={0}
					onValueChange={({ floatValue }) => save({ maxSelect: floatValue ?? 1 })}
					placeholder="1"
					value={group.maxSelect}
				/>
				<CustomSelect
					onChange={selectionType =>
						save({ maxSelect: selectionType === "single" ? 1 : group.maxSelect, selectionType })
					}
					options={[
						{ label: t("admin.products.options.single"), value: "single" },
						{ label: t("admin.products.options.multi"), value: "multi" },
					]}
					value={group.selectionType}
				/>
				<CustomSelect
					onChange={priceRule => save({ priceRule })}
					options={[
						{ label: t("admin.products.options.sum"), value: "sum" },
						{ label: t("admin.products.options.highest"), value: "highest" },
						{ label: t("admin.products.options.average"), value: "average" },
					]}
					value={group.priceRule}
				/>
				<NumericInput
					decimalScale={0}
					onValueChange={({ floatValue }) => save({ sortOrder: floatValue ?? 0 })}
					placeholder="0"
					value={group.sortOrder}
				/>
				<ConfirmActionButton
					confirmation={t("admin.products.options.deleteGroupConfirm")}
					confirmLabel={t("admin.products.options.delete")}
					onConfirm={() => remove.mutate({ groupId: group.id, productId }, { onSuccess: onChange })}
					type="button"
					variant="outline"
				>
					{t("admin.products.options.delete")}
				</ConfirmActionButton>
			</div>
			<div className="space-y-2">
				{group.options.map(option => (
					<OptionEditor
						groupId={group.id}
						key={option.id}
						onChange={onChange}
						option={option}
						productId={productId}
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
