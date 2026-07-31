import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuPencil } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";

interface OptionGroupCardProps {
	name: string;
	onDragEnd?: () => void;
	onDragOver?: (event: DragEvent<HTMLElement>) => void;
	onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
	onDrop?: () => void;
	onEdit?: () => void;
	optionCount: number;
}

export function OptionGroupCard({
	name,
	onDragEnd,
	onDragOver,
	onDragStart,
	onDrop,
	onEdit,
	optionCount,
}: OptionGroupCardProps) {
	const { t } = useTranslation();
	const canDrag = Boolean(onDragStart);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Drop target controlled by a dedicated drag handle.
		<div
			className="overflow-hidden rounded-lg border border-border bg-surface"
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<div className="flex items-center justify-between gap-3 border-border border-b bg-muted/30 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<button
						aria-label={t("admin.products.options.reorder")}
						className="cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-default"
						disabled={!canDrag}
						draggable={canDrag}
						onDragEnd={onDragEnd}
						onDragStart={onDragStart}
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
