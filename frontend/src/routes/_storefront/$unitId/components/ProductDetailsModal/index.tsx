import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCartShopping } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Scrollbar } from "@/components/ui/Scrollbar";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { CartItem, SelectedOption } from "@/stores";
import { showToast, useCartStore } from "@/stores";
import { OptionImagePreviewModal } from "../OptionImagePreviewModal";
import { applyOptionQuantity, findInvalidGroup, isGroupComplete, optionsPriceDelta } from "../product-options";
import { type MenuItem, money } from "../types";
import { ProductOptionGroup } from "./ProductOptionGroup";
import type { OptionImagePreview, ProductOption } from "./types";

interface ProductDetailsModalProps {
	item: MenuItem | null;
	editingItem?: CartItem | null;
	historyMode?: "push" | "replace";
	initialNote?: string;
	initialOptions?: string;
	layer?: "modal" | "submodal";
	onClose: () => void;
	onStateChange?: (options: SelectedOption[], note: string) => void;
	unitId: string;
}

function defaultOptions(item: MenuItem): SelectedOption[] {
	return item.optionGroups
		.filter(group => group.required && group.maxSelect === 1 && group.options.length === 1)
		.reduce(
			(current, group) => applyOptionQuantity(group, group.options[0], 1, current),
			[] as SelectedOption[],
		);
}

function optionsFromSearch(item: MenuItem, serializedOptions?: string): SelectedOption[] {
	if (!serializedOptions) return defaultOptions(item);

	try {
		const parsed: unknown = JSON.parse(serializedOptions);
		if (!Array.isArray(parsed)) return defaultOptions(item);

		return parsed.reduce<SelectedOption[]>((selected, value) => {
			if (
				typeof value !== "object" ||
				value === null ||
				!("optionId" in value) ||
				!("quantity" in value) ||
				typeof value.optionId !== "string" ||
				typeof value.quantity !== "number" ||
				!Number.isInteger(value.quantity) ||
				value.quantity < 1
			)
				return selected;

			const group = item.optionGroups.find(candidate =>
				candidate.options.some(option => option.id === value.optionId),
			);
			const option = group?.options.find(candidate => candidate.id === value.optionId);
			return group && option ? applyOptionQuantity(group, option, value.quantity, selected) : selected;
		}, []);
	} catch {
		return defaultOptions(item);
	}
}

export function ProductDetailsModal({
	editingItem = null,
	historyMode = "push",
	initialNote,
	initialOptions,
	item,
	layer = "modal",
	onClose,
	onStateChange,
	unitId,
}: ProductDetailsModalProps) {
	const { t } = useTranslation();
	const addItem = useCartStore(state => state.addItem);
	const replaceItem = useCartStore(state => state.replaceItem);
	const [note, setNote] = useState("");
	const [localNote, setLocalNote] = useDebouncedInput(note, setNote);
	const [quantity, setQuantity] = useState(1);
	const [options, setOptions] = useState<SelectedOption[]>([]);
	const [imagePreview, setImagePreview] = useState<OptionImagePreview | null>(null);
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
	const [contentViewport, setContentViewport] = useState<HTMLDivElement | null>(null);
	const [optionsViewport, setOptionsViewport] = useState<HTMLDivElement | null>(null);
	const [groupToScroll, setGroupToScroll] = useState<string | null>(null);
	const [initializedModalKey, setInitializedModalKey] = useState<string | null>(null);
	const optionGroupRefs = useRef(new Map<string, HTMLDivElement>());
	const modalKey = item ? `${item.id}:${editingItem?.lineKey ?? "new"}` : null;

	useEffect(() => {
		if (!item) {
			setInitializedModalKey(null);
			return;
		}
		if (initializedModalKey === modalKey) return;

		const nextNote = editingItem?.note ?? initialNote ?? "";
		setNote(nextNote);
		setLocalNote(nextNote);
		setQuantity(editingItem?.quantity ?? 1);
		setExpandedGroupIds(new Set());
		setOptions(editingItem?.options ?? optionsFromSearch(item, initialOptions));
		setInitializedModalKey(modalKey);
	}, [editingItem, initialNote, initialOptions, initializedModalKey, item, modalKey, setLocalNote]);

	useEffect(() => {
		if (!item || initializedModalKey !== modalKey || !onStateChange) return;
		onStateChange(options, note);
	}, [initializedModalKey, item, modalKey, note, onStateChange, options]);

	useEffect(() => {
		if (!item || !groupToScroll) return;
		const groups = item.optionGroups.filter(group => group.options.length > 0);
		const currentIndex = groups.findIndex(group => group.id === groupToScroll);
		const nextGroup = groups[currentIndex + 1];
		if (!nextGroup) {
			setGroupToScroll(null);
			return;
		}

		const frame = requestAnimationFrame(() => {
			optionGroupRefs.current.get(nextGroup.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
			setGroupToScroll(null);
		});
		return () => cancelAnimationFrame(frame);
	}, [groupToScroll, item]);

	if (!item) return null;
	const selectedItem = item;
	const delta = optionsPriceDelta(selectedItem.optionGroups, options);
	const totalCents = (Number(selectedItem.priceCents) + delta) * quantity;
	const invalidGroup = findInvalidGroup(selectedItem.optionGroups, options);

	function setOptionQuantity(groupId: string, option: ProductOption, nextQuantity: number) {
		const group = selectedItem.optionGroups.find(value => value.id === groupId);
		if (!group) return;
		setOptions(current => {
			const next = applyOptionQuantity(group, option, nextQuantity, current);
			if (!isGroupComplete(group, current) && isGroupComplete(group, next)) {
				setExpandedGroupIds(expanded => {
					if (!expanded.has(groupId)) return expanded;
					const withoutGroup = new Set(expanded);
					withoutGroup.delete(groupId);
					return withoutGroup;
				});
				setGroupToScroll(groupId);
			}
			return next;
		});
	}

	function toggleGroupExpanded(groupId: string) {
		setExpandedGroupIds(current => {
			const next = new Set(current);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			return next;
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
		showToast(t(editingItem ? "store.cart.updated" : "store.cart.added"), "positive");
		onClose();
	}

	return (
		<>
			<Modal
				historyMode={historyMode}
				isOpen
				layer={layer}
				maxWidth="1100px"
				onClose={onClose}
				scrollable={false}
				urlKey="product-details"
				urlState={selectedItem.id}
			>
				<div className="flex h-full min-h-0 min-w-0 flex-col gap-4 sm:gap-6">
					<ScrollArea
						className="scrollbar-none min-h-0 flex-1 overflow-y-auto lg:overflow-y-hidden"
						ref={setContentViewport}
					>
						<div
							className={`grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 sm:gap-6 lg:h-full lg:min-h-0 lg:grid-rows-1 ${
								selectedItem.imageUrl ? "lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]" : "lg:grid-cols-1"
							}`}
						>
						{selectedItem.imageUrl && (
							<div className="aspect-[4/3] w-full shrink-0 self-start overflow-hidden rounded-brand bg-muted lg:aspect-square">
								<img alt={selectedItem.title} className="size-full object-cover" src={selectedItem.imageUrl} />
							</div>
						)}
						<div className="flex min-h-0 min-w-0 flex-col gap-5">
							<div className="shrink-0 space-y-2 sm:pr-8">
								<h2 className="font-bold text-2xl text-foreground">{selectedItem.title}</h2>
								{selectedItem.description && (
									<p className="whitespace-pre-line text-muted-foreground text-sm">{selectedItem.description}</p>
								)}
							</div>

							<div className="relative lg:h-0 lg:min-h-0 lg:flex-1">
								<ScrollArea
									className="scrollbar-none lg:h-full lg:overflow-y-auto"
									ref={setOptionsViewport}
								>
									<div className="space-y-5 pr-5">
										{selectedItem.optionGroups
											.filter(group => group.options.length > 0)
											.map(group => (
												<div
													key={group.id}
													ref={element => {
														if (element) optionGroupRefs.current.set(group.id, element);
														else optionGroupRefs.current.delete(group.id);
													}}
												>
													<ProductOptionGroup
														expanded={expandedGroupIds.has(group.id)}
														group={group}
														onImagePreview={setImagePreview}
														onQuantityChange={(option, nextQuantity) =>
															setOptionQuantity(group.id, option, nextQuantity)
														}
														onToggleExpanded={() => toggleGroupExpanded(group.id)}
														options={options}
													/>
												</div>
											))}

										<div className="space-y-2">
											<label className="font-semibold text-sm" htmlFor="product-note">
												{t("store.product.noteLabel")}
											</label>
											<textarea
												className="min-h-20 w-full rounded border border-input bg-surface p-3 placeholder:text-muted-foreground"
												id="product-note"
												name="note"
												onChange={event => setLocalNote(event.currentTarget.value)}
												placeholder={t("store.product.notePlaceholder")}
												value={localNote}
											/>
										</div>
									</div>
								</ScrollArea>
								<Scrollbar className="hidden lg:block" container={optionsViewport} persistent variant="prominent" />
							</div>
						</div>
						</div>
					</ScrollArea>
					<Scrollbar className="lg:hidden" container={contentViewport} persistent variant="prominent" />

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
