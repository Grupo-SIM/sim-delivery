import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Modal } from "@/components/ui/Modal";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { cartDisplayTotalCents, showToast, useCartStore } from "@/stores";
import { CartItemRow } from "./CartItemRow";
import { CartSuggestions } from "./CartSuggestions";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { type MenuItem, type MenuSection, money } from "./types";

interface CartModalProps {
	deliveryFee: number;
	minOrderCents: number;
	onClose: () => void;
	open: boolean;
	sections: MenuSection[];
	unitId: string;
	unitSlug: string;
}

export function CartModal({
	deliveryFee,
	minOrderCents,
	onClose,
	open,
	sections,
	unitId,
	unitSlug,
}: CartModalProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const items = useCartStore(state => state.items);
	const clear = useCartStore(state => state.clear);
	const [editingLineKey, setEditingLineKey] = useState<string | null>(null);
	const [suggestionItem, setSuggestionItem] = useState<MenuItem | null>(null);
	const editingItem = items.find(item => item.lineKey === editingLineKey) ?? null;
	const editingMenuItem = editingItem
		? (sections.flatMap(section => section.items).find(item => item.id === editingItem.id) ?? null)
		: null;

	function handleClear() {
		clear();
		onClose();
		showToast(t("store.cart.clear"), "info");
	}

	const total = cartDisplayTotalCents(items);
	const belowMin = minOrderCents > 0 && total < minOrderCents;

	return (
		<>
			<Modal isOpen={open} onClose={onClose} title={t("store.cart.title")} urlKey="cart">
				{items.length === 0 ? (
					<p className="py-6 text-center text-muted-foreground text-sm">{t("store.cart.empty")}</p>
				) : (
					<div className="space-y-4">
						<div>
							{items.map(item => (
								<CartItemRow item={item} key={item.lineKey} onEdit={() => setEditingLineKey(item.lineKey)} />
							))}
						</div>

						<CartSuggestions onSelect={setSuggestionItem} sections={sections} unitId={unitId} />

						<div className="space-y-1 border-border border-t pt-3">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">{t("store.cart.subtotal")}</span>
								<span className="font-semibold">{money.format(total / 100)}</span>
							</div>
							{deliveryFee > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">{t("store.cart.deliveryFee")}</span>
									<span className="font-medium text-sm">{money.format(deliveryFee / 100)}</span>
								</div>
							)}
						</div>

						{belowMin && (
							<p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-foreground text-xs">
								{t("store.cart.minOrderProgress", { amount: money.format((minOrderCents - total) / 100) })}
							</p>
						)}

						<ConfirmActionButton
							className="w-full"
							confirmation={t("store.cart.clearConfirm")}
							confirmLabel={t("store.cart.clear")}
							onConfirm={handleClear}
							type="button"
							variant="outline"
						>
							{t("store.cart.clear")}
						</ConfirmActionButton>

						<Button
							className="w-full"
							disabled={belowMin}
							onClick={() =>
								closeActiveModalHistory(() => {
									void navigate({ params: { unitId: unitSlug }, to: "/$unitId/checkout" });
								})
							}
							type="button"
						>
							{t("store.cart.checkout")}
						</Button>
					</div>
				)}
			</Modal>
			<ProductDetailsModal
				editingItem={editingItem}
				item={editingMenuItem ?? suggestionItem}
				layer="submodal"
				onClose={() => {
					setEditingLineKey(null);
					setSuggestionItem(null);
				}}
				unitId={unitId}
			/>
		</>
	);
}
