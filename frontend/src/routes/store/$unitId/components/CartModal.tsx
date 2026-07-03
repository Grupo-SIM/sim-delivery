import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { cartTotalCents, showConfirm, useCartStore } from "@/stores";
import { CartItemRow } from "./CartItemRow";
import { CartSuggestions } from "./CartSuggestions";
import { type MenuSection, money } from "./types";

interface CartModalProps {
	onClose: () => void;
	open: boolean;
	sections: MenuSection[];
	unitId: string;
}

export function CartModal({ onClose, open, sections, unitId }: CartModalProps) {
	const { t } = useTranslation();
	const items = useCartStore(state => state.items);
	const clear = useCartStore(state => state.clear);

	async function handleClear() {
		if (await showConfirm(t("store.cart.clearConfirm"))) {
			clear();
			onClose();
		}
	}

	return (
		<Modal isOpen={open} onClose={onClose} title={t("store.cart.title")}>
			{items.length === 0 ? (
				<p className="py-6 text-center text-muted-foreground text-sm">{t("store.cart.empty")}</p>
			) : (
				<div className="space-y-4">
					<div>
						{items.map(item => (
							<CartItemRow item={item} key={item.id} />
						))}
					</div>

					<CartSuggestions sections={sections} unitId={unitId} />

					<div className="flex items-center justify-between border-border border-t pt-3">
						<span className="text-muted-foreground text-sm">{t("store.cart.subtotal")}</span>
						<span className="font-semibold">{money.format(cartTotalCents(items) / 100)}</span>
					</div>

					<Button className="w-full" onClick={handleClear} type="button" variant="outline">
						{t("store.cart.clear")}
					</Button>
				</div>
			)}
		</Modal>
	);
}
