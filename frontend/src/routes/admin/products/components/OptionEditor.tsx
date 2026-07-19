import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical } from "react-icons/lu";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

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
	onChange: (option: EditableOption) => void;
	onDelete: () => void;
	option: EditableOption;
	onDragEnd: () => void;
	onDragOver: (event: DragEvent<HTMLElement>) => void;
	onDragStart: () => void;
	onDrop: () => void;
}

export function OptionEditor({
	onChange,
	onDelete,
	onDragEnd,
	onDragOver,
	onDragStart,
	onDrop,
	option,
}: OptionEditorProps) {
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
	return (
		<div
			className="grid gap-3 rounded border border-border bg-muted/20 p-3 md:grid-cols-2 xl:grid-cols-4"
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<button
				aria-label={t("admin.products.options.reorder")}
				className="cursor-grab self-center text-muted-foreground active:cursor-grabbing"
				draggable
				onDragEnd={onDragEnd}
				onDragStart={event => {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setData("text/plain", option.id);
					onDragStart();
				}}
				type="button"
			>
				<LuGripVertical className="h-5 w-5" />
			</button>
			<Label>
				<span>{t("admin.products.options.optionName")}</span>
				<Input
					onBlur={() => {
						flushName();
						onChange({ ...option, name: localName });
					}}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.products.options.optionPlaceholder")}
					value={localName}
				/>
			</Label>
			<Label>
				<span>{t("admin.products.options.priceDelta")}</span>
				<NumericInput
					decimalScale={2}
					decimalSeparator=","
					onValueChange={({ floatValue }) =>
						onChange({ ...option, priceDeltaCents: Math.round((floatValue ?? 0) * 100) })
					}
					placeholder="R$ 2,50"
					prefix="R$ "
					thousandSeparator="."
					value={option.priceDeltaCents / 100}
				/>
			</Label>
			<Label>
				<span>{t("admin.products.options.maxPerItem")}</span>
				<NumericInput
					decimalScale={0}
					onValueChange={({ floatValue }) => onChange({ ...option, maxPerItem: floatValue ?? null })}
					placeholder={t("admin.products.options.maxPerItem")}
					value={Number(option.maxPerItem ?? 0)}
				/>
			</Label>
			<Label>
				<span>{t("admin.products.options.optionDescription")}</span>
				<Input
					onBlur={() => {
						flushDescription();
						onChange({ ...option, description: localDescription });
					}}
					onChange={event => setLocalDescription(event.currentTarget.value)}
					placeholder={t("admin.products.options.descriptionPlaceholder")}
					value={localDescription}
				/>
			</Label>
			<Label>
				<span>{t("admin.products.options.optionImage")}</span>
				<Input
					onBlur={() => {
						flushImageUrl();
						onChange({ ...option, imageUrl: localImageUrl || null });
					}}
					onChange={event => setLocalImageUrl(event.currentTarget.value)}
					placeholder="https://exemplo.com/opcao.jpg"
					value={localImageUrl}
				/>
			</Label>
			<label className="flex cursor-pointer items-center gap-2 text-sm">
				<input
					checked={option.available}
					onChange={event => onChange({ ...option, available: event.currentTarget.checked })}
					type="checkbox"
				/>
				{t("admin.products.options.available")}
			</label>
			<ConfirmActionButton
				confirmation={t("admin.products.options.deleteOptionConfirm")}
				confirmLabel={t("admin.products.options.delete")}
				onConfirm={onDelete}
				type="button"
				variant="outline"
			>
				{t("admin.products.options.delete")}
			</ConfirmActionButton>
		</div>
	);
}
