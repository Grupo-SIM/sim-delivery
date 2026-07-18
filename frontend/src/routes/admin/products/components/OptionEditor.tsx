import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	useDeleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId,
	usePatchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId,
} from "@/lib/api";
import { showToast } from "@/stores";

export interface EditableOption {
	available: boolean;
	description: string;
	id: string;
	imageUrl: string | null;
	maxPerItem: number | null;
	name: string;
	priceDeltaCents: number;
	sortOrder: number;
}
interface OptionEditorProps {
	groupId: string;
	onChange: () => void;
	option: EditableOption;
	productId: string;
}

export function OptionEditor({ groupId, onChange, option, productId }: OptionEditorProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(option.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [description, setDescription] = useState(option.description);
	const [localDescription, setLocalDescription, flushDescription] = useDebouncedInput(
		description,
		setDescription,
	);
	const [imageUrl, setImageUrl] = useState(option.imageUrl ?? "");
	const [localImageUrl, setLocalImageUrl, flushImageUrl] = useDebouncedInput(imageUrl, setImageUrl);
	const update = usePatchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId();
	const remove = useDeleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId();
	const save = (data: Record<string, unknown>) =>
		update.mutate(
			{ data, groupId, optionId: option.id, productId },
			{
				onSuccess: () => {
					onChange();
					showToast(t("admin.products.options.saved"), "positive");
				},
			},
		);
	return (
		<div className="grid gap-2 rounded border border-border p-2 md:grid-cols-4">
			<Input
				onBlur={() => {
					flushName();
					save({ name: localName });
				}}
				onChange={event => setLocalName(event.currentTarget.value)}
				placeholder={t("admin.products.options.optionPlaceholder")}
				value={localName}
			/>
			<NumericInput
				decimalScale={2}
				decimalSeparator=","
				onValueChange={({ floatValue }) => save({ priceDeltaCents: Math.round((floatValue ?? 0) * 100) })}
				placeholder="R$ 2,50"
				prefix="R$ "
				thousandSeparator="."
				value={option.priceDeltaCents / 100}
			/>
			<NumericInput
				decimalScale={0}
				onValueChange={({ floatValue }) => save({ maxPerItem: floatValue ?? null })}
				placeholder={t("admin.products.options.maxPerItem")}
				value={Number(option.maxPerItem ?? 0)}
			/>
			<NumericInput
				decimalScale={0}
				onValueChange={({ floatValue }) => save({ sortOrder: floatValue ?? 0 })}
				placeholder="0"
				value={option.sortOrder}
			/>
			<Input
				onBlur={() => {
					flushDescription();
					save({ description: localDescription });
				}}
				onChange={event => setLocalDescription(event.currentTarget.value)}
				placeholder={t("admin.products.options.descriptionPlaceholder")}
				value={localDescription}
			/>
			<Input
				onBlur={() => {
					flushImageUrl();
					save({ imageUrl: localImageUrl || null });
				}}
				onChange={event => setLocalImageUrl(event.currentTarget.value)}
				placeholder="https://exemplo.com/opcao.jpg"
				value={localImageUrl}
			/>
			<label className="flex cursor-pointer items-center gap-2 text-sm">
				<input
					checked={option.available}
					onChange={event => save({ available: event.currentTarget.checked })}
					type="checkbox"
				/>
				{t("admin.products.options.available")}
			</label>
			<ConfirmActionButton
				confirmation={t("admin.products.options.deleteOptionConfirm")}
				confirmLabel={t("admin.products.options.delete")}
				onConfirm={() => remove.mutate({ groupId, optionId: option.id, productId }, { onSuccess: onChange })}
				type="button"
				variant="outline"
			>
				{t("admin.products.options.delete")}
			</ConfirmActionButton>
		</div>
	);
}
