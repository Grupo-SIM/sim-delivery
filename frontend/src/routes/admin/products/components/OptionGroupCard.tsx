import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Tooltip } from "@/components/ui/Tooltip";

interface OptionGroupCardProps {
	dragHandleProps?: ComponentProps<"button">;
	name: string;
	onDelete?: () => void;
	onEdit?: () => void;
	optionCount: number;
}

export function OptionGroupCard({
	dragHandleProps,
	name,
	onDelete,
	onEdit,
	optionCount,
}: OptionGroupCardProps) {
	const { t } = useTranslation();
	const canDrag = Boolean(dragHandleProps);

	return (
		<div className="overflow-hidden rounded-lg border border-border bg-surface text-card-foreground">
			<div className="flex items-center justify-between gap-3 border-border border-b bg-muted/30 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<button
						{...dragHandleProps}
						aria-label={t("admin.products.options.reorder")}
						className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing disabled:cursor-default"
						disabled={!canDrag}
						type="button"
					>
						<LuGripVertical className="h-5 w-5" />
					</button>
					<div className="min-w-0">
						<p className="truncate font-semibold">{name}</p>
						<p className="text-muted-foreground text-sm">
							{t("admin.products.options.optionCount", { count: optionCount })}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Tooltip content={t("admin.products.options.edit")}>
						<Button
							aria-label={t("admin.products.options.edit")}
							className="disabled:opacity-100"
							disabled={!onEdit}
							onClick={onEdit}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuPencil className="size-4" />
						</Button>
					</Tooltip>
					<ConfirmActionButton
						aria-label={t("admin.products.options.delete")}
						className="disabled:opacity-100"
						confirmation={t("admin.products.options.deleteGroupConfirm")}
						confirmLabel={t("admin.products.options.delete")}
						disabled={!onDelete}
						idleIcon={<LuTrash2 className="size-4" />}
						onConfirm={() => onDelete?.()}
						size="icon"
						type="button"
						variant="outline"
					>
						{null}
					</ConfirmActionButton>
				</div>
			</div>
		</div>
	);
}
