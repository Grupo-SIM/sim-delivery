import { money } from "../../../components/types";
import type { Option } from "./types";

interface OptionRowProps {
	maxQty: number;
	onChangeQty: (delta: number) => void;
	onToggle: () => void;
	option: Option;
	quantity: number;
	selectionType: string;
}

export function OptionRow({
	maxQty,
	onChangeQty,
	onToggle,
	option,
	quantity,
	selectionType,
}: OptionRowProps) {
	const isSelected = quantity > 0;
	const delta = Number(option.priceDeltaCents);

	if (selectionType === "single") {
		return (
			<button
				className={`flex w-full items-start gap-3 p-3 text-left transition-colors ${isSelected ? "bg-primary/5 ring-1 ring-primary ring-inset" : "hover:bg-muted/40"}`}
				onClick={onToggle}
				type="button"
			>
				{option.imageUrl && (
					<img
						alt={option.name}
						className="size-14 shrink-0 rounded-md object-cover"
						loading="lazy"
						src={option.imageUrl}
					/>
				)}
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm">{option.name}</p>
					{option.description && <p className="text-muted-foreground text-xs">{option.description}</p>}
					{delta !== 0 && <p className="mt-0.5 font-medium text-sm">+{money.format(delta / 100)}</p>}
				</div>
				<div
					className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-primary" : "border-muted-foreground/40"}`}
				>
					{isSelected && <div className="size-2.5 rounded-full bg-primary" />}
				</div>
			</button>
		);
	}

	return (
		<div className="flex items-start gap-3 p-3">
			{option.imageUrl && (
				<img
					alt={option.name}
					className="size-14 shrink-0 rounded-md object-cover"
					loading="lazy"
					src={option.imageUrl}
				/>
			)}
			<div className="min-w-0 flex-1">
				<p className="font-medium text-sm">{option.name}</p>
				{option.description && <p className="text-muted-foreground text-xs">{option.description}</p>}
				{delta !== 0 && <p className="mt-0.5 font-medium text-sm">+{money.format(delta / 100)}</p>}
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<button
					className="flex size-7 items-center justify-center rounded-full border border-border disabled:opacity-40"
					disabled={quantity <= 0}
					onClick={() => onChangeQty(-1)}
					type="button"
				>
					−
				</button>
				<span className="min-w-5 text-center text-sm">{quantity}</span>
				<button
					className="flex size-7 items-center justify-center rounded-full border border-border disabled:opacity-40"
					disabled={quantity >= maxQty}
					onClick={() => onChangeQty(1)}
					type="button"
				>
					+
				</button>
			</div>
		</div>
	);
}
