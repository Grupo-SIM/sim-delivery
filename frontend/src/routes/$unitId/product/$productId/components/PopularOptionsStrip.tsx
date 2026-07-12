import { useTranslation } from "react-i18next";
import { money } from "../../../components/types";
import type { OptionGroup, Selections } from "./types";

interface PopularOptionsStripProps {
	groups: OptionGroup[];
	onSelect: (group: OptionGroup, optionId: string, optionName: string, priceDeltaCents: number) => void;
	selections: Selections;
}

const MAX_POPULAR = 8;

export function PopularOptionsStrip({ groups, onSelect, selections }: PopularOptionsStripProps) {
	const { t } = useTranslation();

	const allWithGroup = groups.flatMap(g =>
		g.options.map(o => ({ group: g, option: o, popularity: Number(o.popularity) })),
	);
	const popular = allWithGroup
		.filter(x => x.popularity > 0)
		.sort((a, b) => b.popularity - a.popularity)
		.slice(0, MAX_POPULAR);

	if (popular.length === 0) return null;

	return (
		<section className="space-y-2">
			<h3 className="font-semibold text-sm">{t("store.product.popularOptions")}</h3>
			<div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
				{popular.map(({ group, option }) => {
					const groupSels = selections[group.id] ?? [];
					const isSelected = groupSels.some(s => s.optionId === option.id);
					const delta = Number(option.priceDeltaCents);

					return (
						<button
							className={`flex shrink-0 flex-col items-start gap-1 rounded-brand border p-2 text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
							key={`${group.id}-${option.id}`}
							onClick={() => onSelect(group, option.id, option.name, delta)}
							type="button"
						>
							{option.imageUrl && (
								<img
									alt={option.name}
									className="h-12 w-20 rounded-md object-cover"
									loading="lazy"
									src={option.imageUrl}
								/>
							)}
							<p className="max-w-20 truncate font-medium text-xs">{option.name}</p>
							{delta > 0 && <p className="text-muted-foreground text-xs">+{money.format(delta / 100)}</p>}
						</button>
					);
				})}
			</div>
		</section>
	);
}
