import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCartShopping } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { CartItem, SelectedOption } from "@/stores";
import { useCartStore } from "@/stores";
import { OptionImagePreviewModal } from "./OptionImagePreviewModal";
import { applyOptionQuantity, findInvalidGroup, optionsPriceDelta } from "./product-options";
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
	const [imagePreview, setImagePreview] = useState<{ alt: string; imageUrl: string } | null>(null);

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
	const totalCents = (Number(selectedItem.priceCents) + delta) * quantity;
	const invalidGroup = findInvalidGroup(selectedItem.optionGroups, options);
	const chooseLabel = (required: boolean, maxSelect: number) => {
		if (required && maxSelect === 1) return t("store.product.chooseExact", { count: 1 });
		if (!required) return t("store.product.chooseUpTo", { count: maxSelect });
		return t("store.product.chooseRange", { max: maxSelect, min: 1 });
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
		<>
			<Modal isOpen maxWidth="1100px" onClose={onClose} scrollable={false}>
				<div className="flex h-full min-h-0 min-w-0 flex-col gap-6">
					<div className="grid min-h-0 min-w-0 flex-1 gap-6 overflow-hidden lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
						<div className="aspect-[4/3] w-full shrink-0 self-start overflow-hidden rounded-brand bg-muted lg:aspect-square">
							{selectedItem.imageUrl ? (
								<img
									alt={selectedItem.title}
									className="size-full object-cover"
									src={selectedItem.imageUrl}
								/>
							) : (
								<div className="size-full" />
							)}
						</div>
						<div className="flex min-h-0 min-w-0 flex-col gap-5">
							<div className="shrink-0 space-y-2 sm:pr-8">
								<h2 className="font-bold text-2xl text-foreground">{selectedItem.title}</h2>
								{selectedItem.description && (
									<p className="whitespace-pre-line text-muted-foreground text-sm">
										{selectedItem.description}
									</p>
								)}
							</div>

							<ScrollArea className="h-0 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
								{selectedItem.optionGroups.map(group => {
								const groupSelected = options.filter(value => value.groupId === group.id);
								const groupQuantity = groupSelected.reduce((sum, value) => sum + value.quantity, 0);
								const groupIsValid = !group.required || groupQuantity >= 1;
								return (
									<section
										className="min-w-0 overflow-hidden rounded-brand border border-border"
										key={group.id}
									>
										<div className="flex min-w-0 items-center justify-between gap-3 bg-muted px-4 py-3">
											<div className="min-w-0">
												<h3 className="font-semibold text-foreground">{group.name}</h3>
												<p className="text-muted-foreground text-sm">
													{chooseLabel(group.required, Number(group.maxSelect))}
												</p>
											</div>
											{group.required ? (
												<span className="shrink-0 rounded bg-foreground px-2 py-1 font-semibold text-[10px] text-background uppercase">
													{t("store.product.required")}
												</span>
											) : groupIsValid ? (
												<span className="font-bold text-primary" title={t("store.product.optional")}>
													✓
												</span>
											) : null}
										</div>
										<div className="divide-y divide-border">
											{group.options.map(option => {
												const selected = options.find(value => value.optionId === option.id);
												const optionLimit = Number(option.maxPerItem ?? group.maxSelect);
												const atLimit =
													(selected?.quantity ?? 0) >= optionLimit ||
													groupQuantity >= Number(group.maxSelect);
												return (
													<div className="flex min-w-0 items-center gap-3 px-4 py-3" key={option.id}>
														{option.imageUrl ? (
															<button
																aria-label={`Ampliar imagem de ${option.name}`}
																className="size-14 shrink-0 cursor-pointer overflow-hidden rounded border border-border"
																onClick={() =>
																	setImagePreview({ alt: option.name, imageUrl: option.imageUrl as string })
																}
																type="button"
															>
																<img alt="" className="size-full object-cover" src={option.imageUrl} />
															</button>
														) : (
															<div className="size-14 shrink-0 rounded bg-muted" />
														)}
														<div className="min-w-0 flex-1">
															<p className="font-medium text-foreground">{option.name}</p>
															{option.description && (
																<p className="truncate text-muted-foreground text-sm">{option.description}</p>
															)}
															<p className="text-muted-foreground text-sm">
																{Number(option.priceDeltaCents) > 0
																	? `+ ${money.format(Number(option.priceDeltaCents) / 100)}`
																	: t("store.product.included")}
															</p>
														</div>
														{group.selectionType === "single" ? (
															<Checkbox
																checked={Boolean(selected)}
																id={`option-${option.id}`}
																onChange={() => setOptionQuantity(group.id, option, selected ? 0 : 1)}
																onClick={event => event.stopPropagation()}
															/>
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
																<span className="w-4 text-center">{selected?.quantity ?? 0}</span>
																<Button
																	disabled={atLimit}
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
										</div>
									</section>
								);
								})}
							</ScrollArea>
						</div>
					</div>

					<div className="space-y-2">
						<label className="font-semibold text-sm" htmlFor="product-note">
							{t("store.product.noteLabel")}
						</label>
						<textarea
							className="min-h-20 w-full rounded border border-input bg-surface p-3 placeholder:text-muted-foreground"
							id="product-note"
							onChange={event => setLocalNote(event.currentTarget.value)}
							placeholder={t("store.product.notePlaceholder")}
							value={localNote}
						/>
					</div>

					<div className="flex items-center justify-between gap-4 border-border border-t pt-4">
						<div className="flex items-center gap-2">
							<Button
								disabled={quantity === 1}
								onClick={() => setQuantity(value => value - 1)}
								type="button"
								variant="outline"
							>
								−
							</Button>
							<span className="w-6 text-center">{quantity}</span>
							<Button onClick={() => setQuantity(value => value + 1)} type="button" variant="outline">
								+
							</Button>
						</div>
						<Button className="gap-3" disabled={Boolean(invalidGroup)} onClick={add} type="button">
							<FaCartShopping aria-hidden="true" />
							<span>{t("store.cart.add")}</span>
							<span>{money.format(totalCents / 100)}</span>
						</Button>
					</div>
				</div>
			</Modal>
			<OptionImagePreviewModal
				alt={imagePreview?.alt ?? ""}
				imageUrl={imagePreview?.imageUrl ?? null}
				onClose={() => setImagePreview(null)}
			/>
		</>
	);
}
