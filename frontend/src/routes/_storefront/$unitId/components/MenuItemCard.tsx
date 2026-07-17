import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuImageOff } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores";
import { type MenuItem, money } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
	unitId: string;
	unitSlug: string;
}

export function MenuItemCard({ item, unitId, unitSlug }: MenuItemCardProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const addItem = useCartStore(state => state.addItem);
	const cartUnitId = useCartStore(state => state.unitId);
	const cartItems = useCartStore(state => state.items);
	const hasGroups = item.optionGroups.length > 0;
	const cartItem =
		cartUnitId === unitId
			? cartItems.find(line => line.id === item.id && line.options.length === 0)
			: undefined;

	const displayPrice = money.format(Number(hasGroups ? item.fromPriceCents : item.priceCents) / 100);

	function handleAdd() {
		if (hasGroups) {
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
		<Card className="group flex h-full flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
			<div className="aspect-[4/3] w-full overflow-hidden bg-muted">
				{item.imageUrl ? (
					<img
						alt={item.title}
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						loading="lazy"
						src={item.imageUrl}
					/>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground/60">
						<LuImageOff aria-label={t("store.menu.imagePlaceholder")} className="size-10" />
					</div>
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
				<p className="font-semibold leading-tight">{item.title}</p>
				{item.description && (
					<p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">{item.description}</p>
				)}
				<div className="mt-auto flex items-end gap-2 pt-2">
					<div>
						{hasGroups && (
							<span className="block text-[11px] text-muted-foreground">{t("store.product.from")}</span>
						)}
						<span className="font-bold text-lg">{displayPrice}</span>
					</div>
					{item.cashbackPercent != null && (
						<Badge className="border-green-500/30 bg-green-500/10 text-green-500">
							{item.cashbackPercent}%
						</Badge>
					)}
					{cartItem && !hasGroups ? (
						<div className="ml-auto flex items-center gap-2 rounded-full border border-primary/30 p-1">
							<Button
								aria-label={t("store.cart.remove")}
								className="size-7 rounded-full p-0"
								onClick={() => useCartStore.getState().setQuantity(cartItem.lineKey, cartItem.quantity - 1)}
								type="button"
								variant="outline"
							>
								−
							</Button>
							<span className="min-w-4 text-center font-semibold text-sm">{cartItem.quantity}</span>
							<Button
								aria-label={t("store.cart.add")}
								className="size-7 rounded-full p-0"
								onClick={handleAdd}
								type="button"
							>
								+
							</Button>
						</div>
					) : (
						<Button className="ml-auto" onClick={handleAdd} size="sm" type="button">
							{t("store.cart.add")}
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
}
