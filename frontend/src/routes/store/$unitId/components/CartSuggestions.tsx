import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores";
import { type MenuItem, type MenuSection, money } from "./types";

interface CartSuggestionsProps {
	sections: MenuSection[];
	unitId: string;
}

const MAX_SUGGESTIONS = 6;

/** Suggests menu items not yet in the cart, prioritizing cashback deals (docs/08). */
export function CartSuggestions({ sections, unitId }: CartSuggestionsProps) {
	const { t } = useTranslation();
	const items = useCartStore(state => state.items);
	const addItem = useCartStore(state => state.addItem);

	const inCart = new Set(items.map(line => line.id));
	const candidates: MenuItem[] = [];
	for (const section of sections) {
		for (const item of section.items) {
			if (!inCart.has(item.id)) {
				candidates.push(item);
			}
		}
	}
	// Cashback deals first, otherwise menu order.
	candidates.sort((a, b) => Number(b.cashbackPercent != null) - Number(a.cashbackPercent != null));
	const suggestions = candidates.slice(0, MAX_SUGGESTIONS);

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<section className="space-y-2">
			<h3 className="font-medium text-sm">{t("store.cart.suggestions")}</h3>
			<div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
				{suggestions.map(item => (
					<Card className="flex w-32 shrink-0 flex-col overflow-hidden" key={item.id}>
						<img alt={item.title} className="h-20 w-full object-cover" loading="lazy" src={item.imageUrl} />
						<div className="flex flex-1 flex-col gap-1 p-2">
							<p className="truncate font-medium text-xs">{item.title}</p>
							<span className="text-muted-foreground text-xs">
								{money.format(Number(item.priceCents) / 100)}
							</span>
							<Button
								className="mt-1 w-full"
								onClick={() =>
									addItem(unitId, {
										id: item.id,
										imageUrl: item.imageUrl,
										priceCents: Number(item.priceCents),
										productId: item.productId,
										title: item.title,
									})
								}
								size="sm"
								type="button"
								variant="outline"
							>
								{t("store.cart.add")}
							</Button>
						</div>
					</Card>
				))}
			</div>
		</section>
	);
}
