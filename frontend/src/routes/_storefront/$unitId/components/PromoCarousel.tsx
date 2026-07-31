import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { type MenuItem, type MenuSection, money } from "./types";

interface PromoCarouselProps {
	sections: MenuSection[];
}

/** Horizontal highlights strip: promotes items that carry a cashback deal (docs/08). */
export function PromoCarousel({ sections }: PromoCarouselProps) {
	const { t } = useTranslation();

	const highlights: MenuItem[] = [];
	const seen = new Set<string>();
	for (const section of sections) {
		for (const item of section.items) {
			if (item.cashbackPercent != null && !seen.has(item.id)) {
				seen.add(item.id);
				highlights.push(item);
			}
		}
	}

	if (highlights.length === 0) {
		return null;
	}

	return (
		<section className="space-y-3">
			<h2 className="font-semibold text-lg">{t("store.menu.highlights")}</h2>
			<ScrollArea className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
				{highlights.map(item => (
					<Card className="flex w-40 shrink-0 flex-col overflow-hidden" key={item.id}>
						{item.imageUrl && (
							<img alt={item.title} className="h-24 w-full object-cover" loading="lazy" src={item.imageUrl} />
						)}
						<div className="flex flex-1 flex-col gap-1 p-3">
							<p className="truncate font-medium text-sm">{item.title}</p>
							<div className="mt-auto flex items-center gap-2 pt-1">
								<span className="font-semibold text-sm">{money.format(Number(item.priceCents) / 100)}</span>
								<Badge className="border-success/30 bg-success/10 text-success">
									{item.cashbackPercent}%
								</Badge>
							</div>
						</div>
					</Card>
				))}
			</ScrollArea>
		</section>
	);
}
