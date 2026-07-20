import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { CartItem, SelectedOption } from "@/stores";
import { useCartStore } from "@/stores";
import { applyOptionQuantity, findInvalidGroup, lineTotal, optionsPriceDelta } from "./product-options";
import { type MenuItem, money } from "./types";

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
		if (!item) return;
		setNote(editingItem?.note ?? "");
		setLocalNote(editingItem?.note ?? "");
		setOptions(editingItem?.options ?? []);
		setQuantity(editingItem?.quantity ?? 1);
	}, [editingItem, item, setLocalNote]);

	if (!item) return null;
	const selectedItem = item;
	const delta = optionsPriceDelta(selectedItem.optionGroups, options);
	const total = lineTotal(selectedItem, options, quantity);
	const invalidGroup = findInvalidGroup(selectedItem.optionGroups, options);
	const chooseLabel = (minSelect: number, maxSelect: number) => {
		if (minSelect === maxSelect) return t("store.product.chooseExact", { count: maxSelect });
		if (minSelect === 0) return t("store.product.chooseUpTo", { count: maxSelect });
		return t("store.product.chooseRange", { max: maxSelect, min: minSelect });
	};

	function setOptionQuantity(
		groupId: string,
		option: MenuItem["optionGroups"][number]["options"][number],
		nextQuantity: number,
	) {
		const group = selectedItem.optionGroups.find(value => value.id === groupId);
		if (!group) return;
		setOptions(current => applyOptionQuantity(group, option, nextQuantity, current));
	}

	function add() {
		const input = {
			id: selectedItem.id,
			imageUrl: selectedItem.imageUrl,
			options,
			priceCents: Number(selectedItem.priceCents) + delta,
			productId: selectedItem.productId,
			title: selectedItem.title,
		};
		if (editingItem) replaceItem(unitId, editingItem.lineKey, input, quantity, note);
		else addItem(unitId, input, quantity, note);
		onClose();
	}

	return (
		<Modal isOpen onClose={onClose} title={selectedItem.title}>
			<div className="space-y-5">
				{selectedItem.imageUrl && (
					<img
						alt={selectedItem.title}
						className="h-44 w-full rounded-brand object-cover"
						src={selectedItem.imageUrl}
					/>
				)}
				{selectedItem.description && (
					<p className="text-muted-foreground text-sm">{selectedItem.description}</p>
				)}
				{selectedItem.optionGroups.map(group => (
					<section className="space-y-2" key={group.id}>
						<div>
							<h3 className="font-semibold">{group.name}</h3>
							<p className="text-muted-foreground text-xs">
								{Number(group.minSelect) > 0 ? t("store.product.required") : t("store.product.optional")} ·{" "}
								{chooseLabel(Number(group.minSelect), Number(group.maxSelect))}
							</p>
						</div>
						{group.options.map(option => {
							const selected = options.find(value => value.optionId === option.id);
							return (
								<div
									className="flex items-center justify-between rounded border border-input p-3"
									key={option.id}
								>
									<span>{option.name}</span>
									{group.selectionType === "single" ? (
										<label className="flex cursor-pointer items-center gap-2">
											<Checkbox
												checked={Boolean(selected)}
												id={`option-${option.id}`}
												onChange={() => setOptionQuantity(group.id, option, selected ? 0 : 1)}
											/>
											<span className="text-sm">{money.format(Number(option.priceDeltaCents) / 100)}</span>
										</label>
									) : (
										<div className="flex items-center gap-2">
											<Button
												disabled={!selected}
												onClick={() =>
													setOptionQuantity(group.id, option, (selected?.quantity ?? 0) - 1)
												}
												size="sm"
												type="button"
												variant="outline"
											>
												−
											</Button>
											<span>{selected?.quantity ?? 0}</span>
											<Button
												onClick={() =>
													setOptionQuantity(group.id, option, (selected?.quantity ?? 0) + 1)
												}
												size="sm"
												type="button"
												variant="outline"
											>
												+
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</section>
				))}
				<textarea
					className="min-h-20 w-full rounded border border-input bg-surface p-3 placeholder:text-muted-foreground"
					onChange={event => setLocalNote(event.currentTarget.value)}
					placeholder={t("store.product.notePlaceholder")}
					value={localNote}
				/>
				{invalidGroup && (
					<p className="text-destructive text-sm">
						{chooseLabel(Number(invalidGroup.minSelect), Number(invalidGroup.maxSelect))}
					</p>
				)}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Button
							disabled={quantity === 1}
							onClick={() => setQuantity(value => value - 1)}
							type="button"
							variant="outline"
						>
							−
						</Button>
						<span>{quantity}</span>
						<Button onClick={() => setQuantity(value => value + 1)} type="button" variant="outline">
							+
						</Button>
					</div>
					<Button disabled={Boolean(invalidGroup)} onClick={add} type="button">
						{t("store.cart.add")} · {money.format(total / 100)}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
