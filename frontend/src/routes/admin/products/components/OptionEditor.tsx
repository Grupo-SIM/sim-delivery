import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { NumericInput } from "@/components/ui/NumericInput";
import { Tooltip } from "@/components/ui/Tooltip";
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
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState(option.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [description, setDescription] = useState(option.description);
	const [localDescription, setLocalDescription, flushDescription] = useDebouncedInput(
		description,
		setDescription,
	);
	const [imageUrl, setImageUrl] = useState(option.imageUrl ?? "");

	return (
		<div className="rounded border border-border bg-muted/20" onDragOver={onDragOver} onDrop={onDrop}>
			<div className="flex min-w-0 items-center gap-3 p-3">
				<button
					aria-label={t("admin.products.options.reorder")}
					className="cursor-grab rounded p-1 text-muted-foreground active:cursor-grabbing"
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
				{option.imageUrl ? (
					<img alt="" className="size-12 shrink-0 rounded object-cover" src={option.imageUrl} />
				) : (
					<div aria-hidden className="size-12 shrink-0 rounded bg-muted" />
				)}
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium">{option.name}</p>
					<p className="truncate text-muted-foreground text-sm">
						{option.description || t("admin.products.options.descriptionPlaceholder")}
					</p>
				</div>
				<p className="shrink-0 text-sm">
					{(option.priceDeltaCents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" })}
				</p>
				<span className="hidden shrink-0 items-center gap-2 text-sm sm:flex">
					<span
						aria-hidden
						className={
							option.available ? "size-2 rounded-full bg-primary" : "size-2 rounded-full bg-muted-foreground"
						}
					/>
					{option.available ? t("admin.products.options.available") : t("admin.products.options.unavailable")}
				</span>
				<div className="flex shrink-0 gap-1">
					<Tooltip content={t("admin.products.options.edit")}>
						<Button
							aria-label={t("admin.products.options.edit")}
							onClick={() => setIsEditing(current => !current)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuPencil className="size-4" />
						</Button>
					</Tooltip>
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
			{isEditing && (
				<div className="grid gap-3 border-border border-t p-4 md:grid-cols-2">
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
				</div>
			)}
		</div>
	);
}
