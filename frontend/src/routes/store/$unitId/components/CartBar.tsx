import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cartCount, cartTotalCents, useCartStore } from "@/stores";
import { CartModal } from "./CartModal";
import { money } from "./types";

interface CartBarProps {
	unitId: string;
}

/** Sticky bottom bar summarizing the current unit's cart; opens the cart modal. */
export function CartBar({ unitId }: CartBarProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const cartUnitId = useCartStore(state => state.unitId);
	const items = useCartStore(state => state.items);

	const count = cartCount(items);
	if (cartUnitId !== unitId || count === 0) {
		return null;
	}

	return (
		<>
			<div className="fixed bottom-4 left-1/2 z-20 w-[92%] max-w-3xl -translate-x-1/2">
				<Button className="w-full justify-between shadow-lg" onClick={() => setOpen(true)} type="button">
					<span>{t("store.cart.open", { count })}</span>
					<span>{money.format(cartTotalCents(items) / 100)}</span>
				</Button>
			</div>
			<CartModal onClose={() => setOpen(false)} open={open} />
		</>
	);
}
