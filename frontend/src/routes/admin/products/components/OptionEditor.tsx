import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { OptionFormFields } from "./OptionFormFields";

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
}

export function OptionEditor({ onChange, onDelete, option }: OptionEditorProps) {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [originalOption, setOriginalOption] = useState<EditableOption | null>(null);
	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
		id: option.id,
	});

	return (
		<div
			className={`rounded border border-border bg-muted/20 transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<div className="flex min-w-0 items-center gap-3 p-3">
				<button
					aria-label={t("admin.products.options.reorder")}
					className="cursor-grab touch-none rounded p-1 text-muted-foreground active:cursor-grabbing"
					type="button"
					{...attributes}
					{...listeners}
				>
					<LuGripVertical className="h-5 w-5" />
				</button>
				{option.imageUrl && (
					<img alt="" className="size-12 shrink-0 rounded object-cover" src={option.imageUrl} />
				)}
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium">{option.name}</p>
					{option.description && (
						<p className="truncate text-muted-foreground text-sm">{option.description}</p>
					)}
				</div>
				<div className="hidden shrink-0 flex-col gap-1 text-right text-xs sm:flex">
					<p>
						{(option.priceDeltaCents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" })}
					</p>
					<span className="flex items-center justify-end gap-2">
						<span
							aria-hidden
							className={
								option.available
									? "size-2 rounded-full bg-primary"
									: "size-2 rounded-full bg-muted-foreground"
							}
						/>
						{option.available
							? t("admin.products.options.available")
							: t("admin.products.options.unavailable")}
					</span>
				</div>
				<div className="flex shrink-0 gap-1">
					<Tooltip content={t("admin.products.options.edit")}>
						<Button
							aria-label={t("admin.products.options.edit")}
							onClick={() => {
								setOriginalOption({ ...option });
								setIsEditing(true);
							}}
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
			<Modal
				isOpen={isEditing}
				maxWidth="640px"
				onClose={() => {
					if (originalOption) onChange(originalOption);
					setIsEditing(false);
				}}
				title={option.name}
			>
				<div className="grid gap-3 md:grid-cols-2">
					<OptionFormFields onChange={onChange} option={option} />
					<div className="flex justify-end gap-2 md:col-span-2">
						<Button
							onClick={() => {
								if (originalOption) onChange(originalOption);
								setIsEditing(false);
							}}
							type="button"
							variant="outline"
						>
							Descartar
						</Button>
						<Button onClick={() => setIsEditing(false)} type="button">
							Salvar
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
