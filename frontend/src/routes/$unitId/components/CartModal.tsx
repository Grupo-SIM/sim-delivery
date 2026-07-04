import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { cartTotalCents, showConfirm, useCartStore } from "@/stores";
import { CartItemRow } from "./CartItemRow";
import { CartSuggestions } from "./CartSuggestions";
import { type MenuSection, money } from "./types";

interface CartModalProps {
	deliveryFee: number;
	onClose: () => void;
	open: boolean;
	sections: MenuSection[];
	unitId: string;
}

export function CartModal({ deliveryFee, onClose, open, sections, unitId }: CartModalProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
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

					<div className="space-y-1 border-border border-t pt-3">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">{t("store.cart.subtotal")}</span>
							<span className="font-semibold">{money.format(cartTotalCents(items) / 100)}</span>
						</div>
						{deliveryFee > 0 && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">{t("store.cart.deliveryFee")}</span>
								<span className="font-medium text-sm">{money.format(deliveryFee / 100)}</span>
							</div>
						)}
					</div>

					<Button
						className="w-full"
						onClick={() => {
							onClose();
							void navigate({ params: { unitId }, to: "/$unitId/checkout" });
						}}
						type="button"
					>
						{t("store.cart.checkout")}
					</Button>

					<Button className="w-full" onClick={handleClear} type="button" variant="outline">
						{t("store.cart.clear")}
					</Button>
				</div>
			)}
		</Modal>
	);
}
