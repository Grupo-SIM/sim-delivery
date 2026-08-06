import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { showToast, useCartStore } from "@/stores";
import { type MenuItem, type MenuSection, money } from "./types";

interface CartSuggestionsProps {
	onSelect: (item: MenuItem) => void;
	sections: MenuSection[];
	unitId: string;
}

const MAX_SUGGESTIONS = 6;

/** Suggests menu items not yet in the cart, prioritizing cashback deals (docs/08). */
export function hasEffectiveOptions(item: MenuItem): boolean {
	return item.optionGroups.some(group => group.options.length > 0);
}

export function getCartSuggestions(sections: MenuSection[], itemIds: string[]): MenuItem[] {
	const inCart = new Set(itemIds);
	const candidates: MenuItem[] = [];
	for (const section of sections) {
		for (const item of section.items) {
			if (!inCart.has(item.id)) candidates.push(item);
		}
	}
	candidates.sort((a, b) => Number(b.cashbackPercent != null) - Number(a.cashbackPercent != null));
	return candidates.slice(0, MAX_SUGGESTIONS);
}

export function CartSuggestions({ onSelect, sections, unitId }: CartSuggestionsProps) {
	const { t } = useTranslation();
	const items = useCartStore(state => state.items);
	const addItem = useCartStore(state => state.addItem);

	const suggestions = getCartSuggestions(
		sections,
		items.map(line => line.id),
	);

	function addDirectly(item: MenuItem) {
		addItem(unitId, {
			id: item.id,
			imageUrl: item.imageUrl,
			options: [],
			priceCents: Number(item.priceCents),
			productId: item.productId,
			title: item.title,
		});
		showToast(t("store.cart.added"), "positive");
	}

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<section className="space-y-2">
			<h3 className="font-medium text-sm">{t("store.cart.suggestions")}</h3>
			<ScrollArea className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
				{suggestions.map(item => (
					<Card className="flex w-32 shrink-0 flex-col overflow-hidden" key={item.id}>
						{item.imageUrl && (
							<img alt={item.title} className="h-20 w-full object-cover" loading="lazy" src={item.imageUrl} />
						)}
						<div className="flex flex-1 flex-col gap-1 p-2">
							<p className="truncate font-medium text-xs">{item.title}</p>
							<span className="text-muted-foreground text-xs">
								{money.format(Number(item.priceCents) / 100)}
							</span>
							<Button
								className="mt-1 w-full"
								onClick={() => (hasEffectiveOptions(item) ? onSelect(item) : addDirectly(item))}
								size="sm"
								type="button"
								variant="outline"
							>
								{t("store.cart.add")}
							</Button>
						</div>
					</Card>
				))}
			</ScrollArea>
		</section>
	);
}
