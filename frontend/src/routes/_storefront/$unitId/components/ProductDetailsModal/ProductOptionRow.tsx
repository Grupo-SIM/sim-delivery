import type { KeyboardEvent, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { SelectedOption } from "@/stores";
import { money } from "../types";
import type { OptionImagePreview, ProductOption, ProductOptionGroup } from "./types";

interface ProductOptionRowProps {
	group: ProductOptionGroup;
	readOnly?: boolean;
	groupQuantity: number;
	onImagePreview: (preview: OptionImagePreview) => void;
	onQuantityChange: (option: ProductOption, quantity: number) => void;
	option: ProductOption;
	selected?: SelectedOption;
}

export function ProductOptionRow({
	group,
	readOnly = false,
	groupQuantity,
	onImagePreview,
	onQuantityChange,
	option,
	selected,
}: ProductOptionRowProps) {
	const isToggle = group.maxSelect === 1 || !group.allowRepeatSelection;
	const optionLimit = group.allowRepeatSelection
		? Number(option.maxPerItem ?? Number.POSITIVE_INFINITY)
		: 1;
	const atOptionLimit = (selected?.quantity ?? 0) >= optionLimit;
	const atGroupLimit =
		group.maxSelect != null && group.maxSelect !== 1 && groupQuantity >= Number(group.maxSelect);
	const atLimit = atOptionLimit || atGroupLimit;
	const rowDisabled = isToggle ? !selected && atLimit : atLimit;

	function selectFromRow() {
		if (readOnly || rowDisabled) return;
		onQuantityChange(option, isToggle ? (selected ? 0 : 1) : (selected?.quantity ?? 0) + 1);
	}

	function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
		event.preventDefault();
		selectFromRow();
	}

	function stopAndChange(event: MouseEvent<HTMLButtonElement>, quantity: number) {
		event.stopPropagation();
		onQuantityChange(option, quantity);
	}

	return (
		<div
			aria-checked={!readOnly && isToggle ? Boolean(selected) : undefined}
			aria-disabled={readOnly ? undefined : rowDisabled}
			className={`flex min-w-0 items-center gap-3 px-4 py-3 transition-colors ${
				selected ? "bg-primary/5" : ""
			} ${readOnly ? "" : rowDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/60"}`}
			onClick={readOnly ? undefined : selectFromRow}
			onKeyDown={readOnly ? undefined : handleRowKeyDown}
			role={readOnly ? undefined : isToggle ? "checkbox" : "button"}
			tabIndex={readOnly ? undefined : 0}
		>
			{option.imageUrl ? (
				<button
					aria-label={`Ampliar imagem de ${option.name}`}
					className="size-14 shrink-0 cursor-pointer overflow-hidden rounded border border-border"
					onClick={event => {
						event.stopPropagation();
						onImagePreview({ alt: option.name, imageUrl: option.imageUrl as string });
					}}
					type="button"
				>
					<img alt="" className="size-full object-cover" src={option.imageUrl} />
				</button>
			) : null}
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<p className="font-medium text-foreground">{option.name}</p>
				{option.description && <p className="break-words text-muted-foreground text-sm">{option.description}</p>}
				{Number(option.priceDeltaCents) > 0 && (
					<p className="text-muted-foreground text-sm">
						{`+ ${money.format(Number(option.priceDeltaCents) / 100)}`}
					</p>
				)}
			</div>
			{!readOnly && (isToggle ? (
				<Checkbox
					checked={Boolean(selected)}
					disabled={!selected && atLimit}
					id={`option-${option.id}`}
					onChange={() => onQuantityChange(option, selected ? 0 : 1)}
					onClick={event => event.stopPropagation()}
					tabIndex={-1}
				/>
			) : (
				<div className="flex items-center gap-2">
					<Button
						disabled={!selected}
						onClick={event => stopAndChange(event, (selected?.quantity ?? 0) - 1)}
						size="sm"
						type="button"
						variant="outline"
					>
						−
					</Button>
					<span className="w-4 text-center">{selected?.quantity ?? 0}</span>
					<Button
						disabled={atLimit}
						onClick={event => stopAndChange(event, (selected?.quantity ?? 0) + 1)}
						size="sm"
						type="button"
						variant="outline"
					>
						+
					</Button>
				</div>
			))}
		</div>
	);
}
