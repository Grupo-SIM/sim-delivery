import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores";
import { type MenuItem, type MenuSection, money } from "./types";

interface TopPicksCarouselProps {
	sections: MenuSection[];
	unitId: string;
	unitSlug: string;
}

const MAX_PICKS = 10;

/** "Os mais pedidos" strip: featuredRank items first (asc), then by popularity (desc). */
export function TopPicksCarousel({ sections, unitId, unitSlug }: TopPicksCarouselProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const addItem = useCartStore(s => s.addItem);

	const allItems: MenuItem[] = [];
	const seen = new Set<string>();
	for (const section of sections) {
		for (const item of section.items) {
			if (!seen.has(item.id)) {
				seen.add(item.id);
				allItems.push(item);
			}
		}
	}

	const featured = allItems
		.filter(i => i.featuredRank != null)
		.sort((a, b) => Number(a.featuredRank) - Number(b.featuredRank));

	const featuredIds = new Set(featured.map(i => i.id));
	const byPopularity = allItems
		.filter(i => !featuredIds.has(i.id) && Number(i.popularity) > 0)
		.sort((a, b) => Number(b.popularity) - Number(a.popularity));

	const picks = [...featured, ...byPopularity].slice(0, MAX_PICKS);

	if (picks.length === 0) return null;

	function handleClick(item: MenuItem) {
		if (item.optionGroups.length > 0) {
			void navigate({
				params: { productId: item.productSlug, unitId: unitSlug },
				to: "/$unitId/product/$productId",
			});
		} else {
			addItem(unitId, {
				id: item.id,
				imageUrl: item.imageUrl,
				options: [],
				priceCents: Number(item.priceCents),
				productId: item.productId,
				title: item.title,
			});
		}
	}

	return (
		<section className="space-y-3">
			<h2 className="font-semibold text-lg">{t("store.menu.topPicks")}</h2>
			<div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
				{picks.map(item => (
					<button
						className="w-40 shrink-0 text-left"
						key={item.id}
						onClick={() => handleClick(item)}
						type="button"
					>
						<Card className="flex h-full flex-col overflow-hidden">
							{item.imageUrl && (
								<img
									alt={item.title}
									className="h-24 w-full object-cover"
									loading="lazy"
									src={item.imageUrl}
								/>
							)}
							<div className="flex flex-1 flex-col gap-1 p-3">
								<p className="truncate font-medium text-sm">{item.title}</p>
								<div className="mt-auto flex items-center gap-2 pt-1">
									<span className="font-semibold text-sm">
										{item.optionGroups.length > 0
											? `${t("store.product.from")} ${money.format(Number(item.fromPriceCents) / 100)}`
											: money.format(Number(item.priceCents) / 100)}
									</span>
									{item.cashbackPercent != null && (
										<Badge className="shrink-0 border-green-500/30 bg-green-500/10 text-green-500">
											{item.cashbackPercent}%
										</Badge>
									)}
								</div>
							</div>
						</Card>
					</button>
				))}
			</div>
		</section>
	);
}
