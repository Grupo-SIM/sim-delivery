import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { CartItem, SelectedOption } from "@/stores";
import { useCartStore } from "@/stores";
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
	const selectedForGroup = (groupId: string) => options.filter(option => option.groupId === groupId);
	const groupQuantity = (groupId: string) =>
		selectedForGroup(groupId).reduce((sum, option) => sum + option.quantity, 0);
	const delta = selectedItem.optionGroups.reduce((sum, group) => {
		const selected = selectedForGroup(group.id);
		const prices = selected.flatMap(option =>
			Array.from({ length: option.quantity }, () => option.priceDeltaCents),
		);
		if (group.priceRule === "highest") return sum + (prices.length ? Math.max(...prices) : 0);
		if (group.priceRule === "average") {
			return (
				sum +
				(prices.length ? Math.round(prices.reduce((total, price) => total + price, 0) / prices.length) : 0)
			);
		}
		return sum + prices.reduce((total, price) => total + price, 0);
	}, 0);
	const total = (Number(selectedItem.priceCents) + delta) * quantity;
	const invalidGroup = selectedItem.optionGroups.find(group => {
		const count = groupQuantity(group.id);
		return count < Number(group.minSelect) || count > Number(group.maxSelect);
	});

	function setOptionQuantity(
		groupId: string,
		groupName: string,
		option: MenuItem["optionGroups"][number]["options"][number],
		nextQuantity: number,
	) {
		const group = selectedItem.optionGroups.find(value => value.id === groupId);
		if (!group) return;
		setOptions(current => {
			if (group.selectionType === "single") {
				return nextQuantity === 0
					? current.filter(value => value.groupId !== groupId)
					: [
							...current.filter(value => value.groupId !== groupId),
							{
								groupId,
								groupName,
								optionId: option.id,
								optionName: option.name,
								priceDeltaCents: Number(option.priceDeltaCents),
								quantity: 1,
							},
						];
			}
			if (nextQuantity < 0 || nextQuantity > Number(option.maxPerItem ?? group.maxSelect)) return current;
			const totalWithout = current
				.filter(value => value.groupId !== groupId || value.optionId === option.id)
				.reduce((sum, value) => sum + (value.optionId === option.id ? 0 : value.quantity), 0);
			if (totalWithout + nextQuantity > Number(group.maxSelect)) return current;
			return nextQuantity === 0
				? current.filter(value => value.optionId !== option.id)
				: current.some(value => value.optionId === option.id)
					? current.map(value =>
							value.optionId === option.id ? { ...value, quantity: nextQuantity } : value,
						)
					: [
							...current,
							{
								groupId,
								groupName,
								optionId: option.id,
								optionName: option.name,
								priceDeltaCents: Number(option.priceDeltaCents),
								quantity: nextQuantity,
							},
						];
		});
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
								{t("store.product.chooseRange", { max: group.maxSelect, min: group.minSelect })}
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
										<Button
											onClick={() => setOptionQuantity(group.id, group.name, option, selected ? 0 : 1)}
											size="sm"
											type="button"
											variant={selected ? "default" : "outline"}
										>
											{selected ? "✓" : money.format(Number(option.priceDeltaCents) / 100)}
										</Button>
									) : (
										<div className="flex items-center gap-2">
											<Button
												disabled={!selected}
												onClick={() =>
													setOptionQuantity(group.id, group.name, option, (selected?.quantity ?? 0) - 1)
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
													setOptionQuantity(group.id, group.name, option, (selected?.quantity ?? 0) + 1)
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
						{t("store.product.chooseRange", { max: invalidGroup.maxSelect, min: invalidGroup.minSelect })}
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
