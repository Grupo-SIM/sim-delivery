import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { CartItem, SelectedOption } from "@/stores";
import { useCartStore } from "@/stores";
import { money, type MenuItem } from "./types";

interface ProductDetailsModalProps {
	item: MenuItem | null;
	editingItem?: CartItem | null;
	onClose: () => void;
	unitId: string;
}

export function ProductDetailsModal({ editingItem = null, item, onClose, unitId }: ProductDetailsModalProps) {
	const { t } = useTranslation();
	const addItem = useCartStore(state => state.addItem);
	const replaceItem = useCartStore(state => state.replaceItem);
	const [note, setNote] = useState("");
	const [localNote, setLocalNote] = useDebouncedInput(note, setNote);
	const [quantity, setQuantity] = useState(1);
	const [options, setOptions] = useState<SelectedOption[]>([]);

	useEffect(() => {
		setNote(editingItem?.note ?? "");
		setLocalNote(editingItem?.note ?? "");
		setOptions(editingItem?.options ?? []);
		setQuantity(editingItem?.quantity ?? 1);
	}, [editingItem, item?.id, setLocalNote]);

	if (!item) return null;
	const selectedItem = item;
	const delta = options.reduce((sum, option) => sum + option.priceDeltaCents * option.quantity, 0);
	const total = (Number(selectedItem.priceCents) + delta) * quantity;

	function toggle(groupId: string, groupName: string, option: MenuItem["optionGroups"][number]["options"][number]) {
		const group = selectedItem.optionGroups.find(value => value.id === groupId);
		if (!group) return;
		setOptions(current => {
			const existing = current.find(value => value.optionId === option.id);
			if (group.selectionType === "single") {
				return existing
					? current.filter(value => value.groupId !== groupId)
					: [...current.filter(value => value.groupId !== groupId), { groupId, groupName, optionId: option.id, optionName: option.name, priceDeltaCents: Number(option.priceDeltaCents), quantity: 1 }];
			}
			return existing
				? current.filter(value => value.optionId !== option.id)
				: [...current, { groupId, groupName, optionId: option.id, optionName: option.name, priceDeltaCents: Number(option.priceDeltaCents), quantity: 1 }];
		});
	}

	function add() {
		const input = { id: selectedItem.id, imageUrl: selectedItem.imageUrl, options, priceCents: Number(selectedItem.priceCents) + delta, productId: selectedItem.productId, title: selectedItem.title };
		if (editingItem) replaceItem(unitId, editingItem.lineKey, input, quantity, note);
		else addItem(unitId, input, quantity, note);
		onClose();
	}

	return (
		<Modal isOpen onClose={onClose} title={selectedItem.title}>
			<div className="space-y-5">
				{selectedItem.imageUrl && <img alt={selectedItem.title} className="h-44 w-full rounded-brand object-cover" src={selectedItem.imageUrl} />}
				{selectedItem.description && <p className="text-muted-foreground text-sm">{selectedItem.description}</p>}
				{selectedItem.optionGroups.map(group => (
					<section className="space-y-2" key={group.id}>
						<div><h3 className="font-semibold">{group.name}</h3><p className="text-muted-foreground text-xs">{Number(group.minSelect) > 0 ? t("store.product.required") : "Opcional"}</p></div>
						{group.options.map(option => {
							const selected = options.some(value => value.optionId === option.id);
							return <button className="flex w-full cursor-pointer items-center justify-between rounded border border-input p-3 text-left hover:bg-muted" key={option.id} onClick={() => toggle(group.id, group.name, option)} type="button"><span>{option.name}</span><span className="font-medium">{selected ? "✓" : money.format(Number(option.priceDeltaCents) / 100)}</span></button>;
						})}
					</section>
				))}
				<textarea className="min-h-20 w-full rounded border border-input bg-surface p-3 placeholder:text-muted-foreground" onChange={event => setLocalNote(event.currentTarget.value)} placeholder={t("store.product.notePlaceholder")} value={localNote} />
				<div className="flex items-center justify-between"><div className="flex items-center gap-2"><Button disabled={quantity === 1} onClick={() => setQuantity(value => value - 1)} type="button" variant="outline">−</Button><span>{quantity}</span><Button onClick={() => setQuantity(value => value + 1)} type="button" variant="outline">+</Button></div><Button onClick={add} type="button">{t("store.cart.add")} · {money.format(total / 100)}</Button></div>
			</div>
		</Modal>
	);
}
