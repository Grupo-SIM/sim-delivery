import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuPencil } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";

interface OptionGroupCardProps {
	dragHandleProps?: ComponentProps<"button">;
	name: string;
	onEdit?: () => void;
	optionCount: number;
}

export function OptionGroupCard({ dragHandleProps, name, onEdit, optionCount }: OptionGroupCardProps) {
	const { t } = useTranslation();
	const canDrag = Boolean(dragHandleProps);

	return (
		<div className="overflow-hidden rounded-lg border border-border bg-surface">
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
			</div>
		</div>
	);
}
