import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { useGetPublicProductReviews } from "@/lib/api";
import { slug } from "@/lib/variant";
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
	const reviewsQuery = useGetPublicProductReviews(
		{ productId: item?.productId ?? "", slug },
		{ query: { enabled: item !== null } },
	);

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
				{Number(selectedItem.ratingCount) > 0 && (
					<StarRating average={selectedItem.ratingAverage} count={Number(selectedItem.ratingCount)} />
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

				<section className="space-y-2 border-border border-t pt-4">
					<h3 className="font-semibold">{t("store.product.reviews.title")}</h3>
					{reviewsQuery.isError ? (
						<ErrorState title={t("store.product.reviews.loadError")} />
					) : reviewsQuery.data && reviewsQuery.data.length === 0 ? (
						<p className="text-muted-foreground text-sm">{t("store.product.reviews.empty")}</p>
					) : (
						<div className="max-h-48 space-y-3 overflow-auto">
							{reviewsQuery.data?.map(review => (
								<div className="space-y-1 rounded border border-border p-3" key={review.id}>
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium text-sm">{review.customerName}</span>
										<span aria-hidden className="text-sm">
											{"⭐".repeat(Number(review.rating))}
											{"☆".repeat(5 - Number(review.rating))}
										</span>
									</div>
									{review.comment && <p className="text-muted-foreground text-sm">{review.comment}</p>}
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</Modal>
	);
}
