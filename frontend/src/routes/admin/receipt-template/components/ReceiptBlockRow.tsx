import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuMinus, LuReceiptText, LuTrash2, LuType } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/ui/TextField";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import type { ReceiptBlock, ReceiptBlockMeta } from "./types";

interface ReceiptBlockRowProps {
	block: ReceiptBlock;
	meta: ReceiptBlockMeta;
	onChange: (block: ReceiptBlock) => void;
	onRemove: () => void;
}

export function ReceiptBlockRow({ block, meta, onChange, onRemove }: ReceiptBlockRowProps) {
	const { t } = useTranslation();
	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
	const Icon = block.type === "text" ? LuType : block.type === "separator" ? LuMinus : LuReceiptText;

	return (
		<div
			className={cn(
				"rounded-lg border border-border bg-card p-3 shadow-sm transition-[border-color,box-shadow,opacity]",
				isDragging && "z-20 opacity-40 shadow-xl",
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<div className="flex items-center gap-3">
				<Tooltip content={t("admin.receiptTemplate.actions.reorder")}>
					<button
						{...attributes}
						{...listeners}
						aria-label={t("admin.receiptTemplate.actions.reorder")}
						className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
						type="button"
					>
						<LuGripVertical className="size-4" />
					</button>
				</Tooltip>
				<div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm">{meta.label}</p>
					<p className="truncate text-muted-foreground text-xs">{meta.description}</p>
				</div>
				<Tooltip content={t("admin.receiptTemplate.actions.remove")}>
					<Button aria-label={t("admin.receiptTemplate.actions.remove")} onClick={onRemove} size="icon" type="button" variant="outline">
						<LuTrash2 className="size-4" />
					</Button>
				</Tooltip>
			</div>

			{block.type === "orderNumber" && (
				<div className="mt-4 space-y-2 border-border/70 border-t pt-4">
					<span className="font-medium text-sm">{t("admin.receiptTemplate.orderNumber.style")}</span>
					<CustomSelect
						onChange={orderNumberStyle =>
							onChange({ ...block, orderNumberStyle: orderNumberStyle as ReceiptBlock["orderNumberStyle"] })
						}
						options={[
							{ label: t("admin.receiptTemplate.orderNumber.normal"), value: "normal" },
							{ label: t("admin.receiptTemplate.orderNumber.giant"), value: "giant" },
						]}
						value={block.orderNumberStyle ?? "normal"}
					/>
				</div>
			)}

			{block.type === "separator" && (
				<div className="mt-4 space-y-2 border-border/70 border-t pt-4">
					<span className="font-medium text-sm">{t("admin.receiptTemplate.separator.style")}</span>
					<CustomSelect
						onChange={separatorStyle =>
							onChange({ ...block, separatorStyle: separatorStyle as ReceiptBlock["separatorStyle"] })
						}
						options={[
							{ label: t("admin.receiptTemplate.separator.solid"), value: "solid" },
							{ label: t("admin.receiptTemplate.separator.dashed"), value: "dashed" },
						]}
						value={block.separatorStyle ?? "solid"}
					/>
				</div>
			)}

			{block.type === "text" && (
				<div className="mt-4 grid gap-3 border-border/70 border-t pt-4 sm:grid-cols-2">
					<TextField
						className="sm:col-span-2"
						label={t("admin.receiptTemplate.text.content")}
						maxLength={500}
						name={`receipt-text-${block.id}`}
						onValueChange={content => onChange({ ...block, content })}
						placeholder={t("admin.receiptTemplate.text.placeholder")}
						value={block.content ?? ""}
					/>
					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.receiptTemplate.text.alignment")}</span>
						<CustomSelect
							onChange={align => onChange({ ...block, align: align as ReceiptBlock["align"] })}
							options={[
								{ label: t("admin.receiptTemplate.text.alignLeft"), value: "left" },
								{ label: t("admin.receiptTemplate.text.alignCenter"), value: "center" },
								{ label: t("admin.receiptTemplate.text.alignRight"), value: "right" },
							]}
							value={block.align ?? "left"}
						/>
					</div>
					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.receiptTemplate.text.size")}</span>
						<CustomSelect
							onChange={size => onChange({ ...block, size: size as ReceiptBlock["size"] })}
							options={[
								{ label: t("admin.receiptTemplate.text.sizeSmall"), value: "small" },
								{ label: t("admin.receiptTemplate.text.sizeNormal"), value: "normal" },
								{ label: t("admin.receiptTemplate.text.sizeLarge"), value: "large" },
							]}
							value={block.size ?? "normal"}
						/>
					</div>
					<Label className="flex cursor-pointer grid-cols-[auto_1fr] items-center gap-2 sm:col-span-2">
						<Checkbox
							checked={block.bold ?? false}
							onChange={event => onChange({ ...block, bold: event.currentTarget.checked })}
						/>
						<span>{t("admin.receiptTemplate.text.bold")}</span>
					</Label>
				</div>
			)}
		</div>
	);
}
