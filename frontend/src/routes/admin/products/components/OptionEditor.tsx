import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuTrash2 } from "react-icons/lu";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

export interface EditableOption {
	available: boolean;
	description: string;
	id: string;
	imageUrl: string | null;
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
	return (
		<div
			className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-3 gap-y-4 rounded border border-border bg-muted/20 p-4"
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<button
				aria-label={t("admin.products.options.reorder")}
				className="row-span-2 cursor-grab self-center justify-self-start rounded p-1 text-muted-foreground active:cursor-grabbing"
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
			<div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4">
			<Label className="min-w-0">
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
			<Label className="min-w-0">
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
			<div className="col-span-2 grid grid-cols-[minmax(0,1fr)_6.5rem_auto] items-end gap-3">
			<Label className="min-w-0">
				<span>{t("admin.products.options.optionImage")}</span>
				<MediaUrlInput
					asset="product"
					onUploadError={() => undefined}
					onValueChange={value => {
						setImageUrl(value);
						onChange({ ...option, imageUrl: value || null });
					}}
					uploadLabel={t("admin.products.options.optionImage")}
					value={imageUrl}
				/>
			</Label>
			<Label className="w-[6.5rem]">
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
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 text-sm">
					<Checkbox
						checked={option.available}
						id={`option-${option.id}-available`}
						onChange={event => onChange({ ...option, available: event.currentTarget.checked })}
					/>
					<label className="cursor-pointer" htmlFor={`option-${option.id}-available`}>
						{t("admin.products.options.available")}
					</label>
				</div>
				<ConfirmActionButton
					aria-label={t("admin.products.options.delete")}
					confirmation={t("admin.products.options.deleteOptionConfirm")}
					confirmLabel={t("admin.products.options.delete")}
					idleIcon={<LuTrash2 className="size-4" />}
					onConfirm={onDelete}
					size="icon"
					type="button"
					variant="outline"
				>
					{null}
				</ConfirmActionButton>
			</div>
			</div>
			</div>
		</div>
	);
}
