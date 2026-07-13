import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cartCount, cartTotalCents, useCartStore, useDeliveryMethodStore } from "@/stores";
import { CartModal } from "./CartModal";
import { type MenuSection, money } from "./types";

interface CartBarProps {
	deliveryFee: number;
	minOrderCents: number;
	sections: MenuSection[];
	unitId: string;
	unitSlug: string;
}

/** Sticky bottom bar summarizing the current unit's cart; opens the cart modal. */
export function CartBar({ deliveryFee, minOrderCents, sections, unitId, unitSlug }: CartBarProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const cartUnitId = useCartStore(state => state.unitId);
	const items = useCartStore(state => state.items);
	const storedMethod = useDeliveryMethodStore(state => state.methods[unitId]);

	const count = cartCount(items);
	if (cartUnitId !== unitId || count === 0) {
		return null;
	}

	const total = cartTotalCents(items);
	// Min order only applies to delivery orders (default when no method stored)
	const isDelivery = storedMethod !== "pickup";
	const belowMin = isDelivery && minOrderCents > 0 && total < minOrderCents;

	return (
		<>
			<div className="fixed bottom-4 left-1/2 z-20 w-[92%] max-w-3xl -translate-x-1/2 space-y-1.5">
				{belowMin && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-amber-800 text-xs">
						{t("store.cart.minOrderProgress", { amount: money.format((minOrderCents - total) / 100) })}
					</div>
				)}
				<Button className="w-full justify-between shadow-lg" onClick={() => setOpen(true)} type="button">
					<span>{t("store.cart.open", { count })}</span>
					<span>{money.format(total / 100)}</span>
				</Button>
			</div>
			<CartModal
				deliveryFee={deliveryFee}
				minOrderCents={isDelivery ? minOrderCents : 0}
				onClose={() => setOpen(false)}
				open={open}
				sections={sections}
				unitId={unitId}
				unitSlug={unitSlug}
			/>
		</>
	);
}
