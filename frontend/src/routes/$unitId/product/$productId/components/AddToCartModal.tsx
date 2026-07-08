import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { money } from "../../../components/types";

interface AddToCartModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirmAndStay: (quantity: number, note: string) => void;
	onConfirmAndCheckout: (quantity: number, note: string) => void;
	priceCents: number;
	title: string;
}

export function AddToCartModal({
	isOpen,
	onClose,
	onConfirmAndStay,
	onConfirmAndCheckout,
	priceCents,
	title,
}: AddToCartModalProps) {
	const { t } = useTranslation();
	const [quantity, setQuantity] = useState(1);
	const [note, setNote] = useState("");
	const [localNote, setLocalNote] = useDebouncedInput(note, setNote);

	function reset() {
		setQuantity(1);
		setNote("");
		setLocalNote("");
	}

	function handleClose() {
		reset();
		onClose();
	}

	function handleStay() {
		const qty = quantity;
		const n = note;
		reset();
		onConfirmAndStay(qty, n);
	}

	function handleCheckout() {
		const qty = quantity;
		const n = note;
		reset();
		onConfirmAndCheckout(qty, n);
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title={t("store.product.addedTitle", { title })}>
			<div className="space-y-4">
				<div className="space-y-1">
					<span className="font-medium text-sm">{t("store.product.quantity")}</span>
					<div className="flex items-center gap-3">
						<Button
							disabled={quantity <= 1}
							onClick={() => setQuantity(q => q - 1)}
							size="sm"
							type="button"
							variant="outline"
						>
							−
						</Button>
						<span className="min-w-6 text-center font-semibold">{quantity}</span>
						<Button
							onClick={() => setQuantity(q => q + 1)}
							size="sm"
							type="button"
							variant="outline"
						>
							+
						</Button>
						<span className="ml-auto font-semibold text-primary">
							{money.format((priceCents * quantity) / 100)}
						</span>
					</div>
				</div>

				<div className="space-y-1">
					<span className="font-medium text-sm">{t("store.cart.notePlaceholder")}</span>
					<textarea
						className="min-h-16 w-full rounded border border-input bg-surface px-2 py-1 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						onChange={e => setLocalNote(e.currentTarget.value)}
						placeholder={t("store.product.notePlaceholder")}
						value={localNote}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Button className="w-full" onClick={handleCheckout} type="button">
						{t("store.product.goToCart")}
					</Button>
					<Button className="w-full" onClick={handleStay} type="button" variant="outline">
						{t("store.product.continueShopping")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
