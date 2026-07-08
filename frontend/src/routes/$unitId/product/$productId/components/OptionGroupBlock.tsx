import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { OptionRow } from "./OptionRow";
import type { OptionGroup, Selection } from "./types";

interface OptionGroupBlockProps {
	group: OptionGroup;
	onChangeQty: (optionId: string, optionName: string, priceDeltaCents: number, delta: number) => void;
	onToggle: (optionId: string, optionName: string, priceDeltaCents: number) => void;
	query: string;
	selections: Selection[];
}

export function OptionGroupBlock({ group, onChangeQty, onToggle, query, selections }: OptionGroupBlockProps) {
	const { t } = useTranslation();
	const minSelect = Number(group.minSelect);
	const maxSelect = Number(group.maxSelect);
	const isRequired = minSelect >= 1;
	const totalSelected = selections.reduce((sum, s) => sum + s.quantity, 0);
	const [open, setOpen] = useState(isRequired);

	let subtitle: string;
	if (minSelect === 0) {
		subtitle = t("store.product.chooseUpTo", { count: maxSelect });
	} else if (minSelect === maxSelect) {
		subtitle = t("store.product.chooseExact", { count: minSelect });
	} else {
		subtitle = t("store.product.chooseRange", { max: maxSelect, min: minSelect });
	}

	const q = query.trim().toLowerCase();
	const filteredOptions = q
		? group.options.filter(o =>
				`${o.name} ${o.description}`.toLowerCase().includes(q),
			)
		: group.options;

	if (filteredOptions.length === 0) return null;

	return (
		<div className="overflow-hidden rounded-brand border border-border">
			<button
				className="flex w-full items-center justify-between gap-2 p-4 text-left"
				onClick={() => setOpen(v => !v)}
				type="button"
			>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold">{group.name}</span>
						{isRequired && (
							<Badge className="border-primary/30 bg-primary/5 text-primary text-xs">
								{t("store.product.required")}
							</Badge>
						)}
					</div>
					<p className="text-muted-foreground text-xs">{subtitle}</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<span className="text-muted-foreground text-sm font-medium">
						{totalSelected}/{maxSelect}
					</span>
					<span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
				</div>
			</button>

			{open && (
				<div className="divide-y divide-border/60 border-border border-t">
					{filteredOptions.map(option => {
						const sel = selections.find(s => s.optionId === option.id);
						const qty = sel?.quantity ?? 0;
						const perItemMax =
							option.maxPerItem != null ? Number(option.maxPerItem) : maxSelect;
						const groupRemainder = maxSelect - totalSelected + qty;
						const maxQty = Math.min(perItemMax, groupRemainder);

						return (
							<OptionRow
								key={option.id}
								maxQty={maxQty}
								onChangeQty={delta =>
									onChangeQty(option.id, option.name, Number(option.priceDeltaCents), delta)
								}
								onToggle={() =>
									onToggle(option.id, option.name, Number(option.priceDeltaCents))
								}
								option={option}
								quantity={qty}
								selectionType={group.selectionType}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
}
