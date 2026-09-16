import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cartCount, cartDisplayTotalCents, useCartStore, useDeliveryMethodStore } from "@/stores";
import { DesktopCartItem } from "./DesktopCartItem";
import { money } from "./types";

interface DesktopCartProps {
	deliveryFee: number;
	minOrderCents: number;
	unitId: string;
	unitSlug: string;
}

export function DesktopCart({ deliveryFee, minOrderCents, unitId, unitSlug }: DesktopCartProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const cartUnitId = useCartStore(state => state.unitId);
	const items = useCartStore(state => state.items);
	const storedMethod = useDeliveryMethodStore(state => state.methods[unitId]);
	const count = cartCount(items);
	const total = cartDisplayTotalCents(items);
	const isDelivery = storedMethod !== "pickup";
	const belowMin = isDelivery && minOrderCents > 0 && total < minOrderCents;
	const isCurrentUnit = cartUnitId === unitId;

	return (
		<aside className="hidden lg:block">
			<div className="sticky top-4 overflow-hidden rounded-brand border border-border bg-card">
				<div className="border-border border-b px-5 py-5">
					<h2 className="font-bold text-lg">{t("store.cart.title")}</h2>
					<p className="text-muted-foreground text-sm">
						{isCurrentUnit ? t("store.cart.open", { count }) : t("store.cart.empty")}
					</p>
				</div>
				{isCurrentUnit && count > 0 ? (
					<>
						<ScrollArea className="max-h-[52vh] divide-y divide-border/70 overflow-y-auto px-5">
							{items.map(item => (
								<DesktopCartItem item={item} key={item.lineKey} />
							))}
						</ScrollArea>
						<div className="space-y-3 border-border border-t p-5">
							<div className="flex items-center justify-between font-semibold">
								<span>{t("store.cart.subtotal")}</span>
								<span>{money.format(total / 100)}</span>
							</div>
							{deliveryFee > 0 && isDelivery && (
								<p className="text-muted-foreground text-xs">
									{t("store.cart.deliveryFee")}: {money.format(deliveryFee / 100)}
								</p>
							)}
							{belowMin && (
								<p className="text-destructive text-xs">
									{t("store.cart.minOrderProgress", { amount: money.format((minOrderCents - total) / 100) })}
								</p>
							)}
							<Button
								className="w-full"
								disabled={belowMin}
								onClick={() => void navigate({ params: { unitId: unitSlug }, to: "/$unitId/checkout" })}
								type="button"
							>
								{t("store.cart.checkout")}
							</Button>
						</div>
					</>
				) : (
					<p className="px-5 py-10 text-center text-muted-foreground text-sm">{t("store.cart.empty")}</p>
				)}
			</div>
		</aside>
	);
}
