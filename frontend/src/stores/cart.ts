import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductFee } from "@/lib/platform-fees";
import { displayedUnitPrice } from "@/lib/platform-fees";

export interface SelectedOption {
	groupId: string;
	groupName: string;
	optionId: string;
	optionName: string;
	/** Number of times this option was chosen (for multi/stepper groups). */
	quantity: number;
	priceDeltaCents: number;
}

/** A line in the cart. `lineKey` is the stable identity (unit-product id + options hash). */
export interface CartItem {
	id: string;
	imageUrl: string;
	/** Unique key per distinct combination of product + selected options. */
	lineKey: string;
	note: string;
	options: SelectedOption[];
	/** Total price in cents including option deltas (base + Σ deltas*qty). */
	priceCents: number;
	productId: string;
	productFees?: ProductFee[];
	quantity: number;
	title: string;
}

/** Fields needed to seed a new line; quantity/note/lineKey are managed by the store. */
export type CartItemInput = Omit<CartItem, "lineKey" | "note" | "quantity">;

export interface CartState {
	addItem: (unitId: string, item: CartItemInput, quantity?: number, note?: string) => void;
	checkoutIdempotencyKey: string | null;
	clear: () => void;
	/** Stable request key for the current cart, persisted across checkout refreshes. */
	getCheckoutIdempotencyKey: () => string;
	items: CartItem[];
	removeItem: (lineKey: string) => void;
	replaceItem: (unitId: string, lineKey: string, item: CartItemInput, quantity: number, note: string) => void;
	setNote: (lineKey: string, note: string) => void;
	setQuantity: (lineKey: string, quantity: number) => void;
	/** The unit this cart belongs to; a cart holds items from a single unit at a time. */
	unitId: string | null;
}

export function makeLineKey(id: string, options: SelectedOption[]): string {
	const sorted = [...options]
		.sort((a, b) => a.optionId.localeCompare(b.optionId))
		.map(o => `${o.optionId}:${o.quantity}`)
		.join("|");
	return sorted ? `${id}::${sorted}` : id;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			addItem: (unitId, item, quantity = 1, note = "") =>
				set(state => {
					// Switching units starts a fresh cart (one unit at a time).
					const base = state.unitId === unitId ? state.items : [];
					const lineKey = makeLineKey(item.id, item.options);
					const existing = base.find(line => line.lineKey === lineKey);
					const items = existing
						? base.map(line =>
								line.lineKey === lineKey ? { ...line, quantity: line.quantity + quantity } : line,
							)
						: [...base, { ...item, lineKey, note, quantity }];
					return { checkoutIdempotencyKey: null, items, unitId };
				}),
			checkoutIdempotencyKey: null,
			clear: () => set({ checkoutIdempotencyKey: null, items: [], unitId: null }),
			getCheckoutIdempotencyKey: () => {
				const existing = get().checkoutIdempotencyKey;
				if (existing) return existing;

				const checkoutIdempotencyKey = globalThis.crypto.randomUUID();
				set({ checkoutIdempotencyKey });
				return checkoutIdempotencyKey;
			},
			items: [],
			removeItem: lineKey =>
				set(state => {
					const items = state.items.filter(line => line.lineKey !== lineKey);
					return {
						checkoutIdempotencyKey: null,
						items,
						unitId: items.length === 0 ? null : state.unitId,
					};
				}),
			replaceItem: (unitId, lineKey, item, quantity, note) =>
				set(state => {
					const base = state.unitId === unitId ? state.items.filter(line => line.lineKey !== lineKey) : [];
					const nextLineKey = makeLineKey(item.id, item.options);
					const existing = base.find(line => line.lineKey === nextLineKey);
					const items = existing
						? base.map(line =>
								line.lineKey === nextLineKey ? { ...line, quantity: line.quantity + quantity } : line,
							)
						: [...base, { ...item, lineKey: nextLineKey, note, quantity }];
					return { checkoutIdempotencyKey: null, items, unitId };
				}),
			setNote: (lineKey, note) =>
				set(state => ({
					checkoutIdempotencyKey: null,
					items: state.items.map(line => (line.lineKey === lineKey ? { ...line, note } : line)),
				})),
			setQuantity: (lineKey, quantity) => {
				if (quantity <= 0) {
					get().removeItem(lineKey);
					return;
				}
				set(state => ({
					checkoutIdempotencyKey: null,
					items: state.items.map(line => (line.lineKey === lineKey ? { ...line, quantity } : line)),
				}));
			},
			unitId: null,
		}),
		{ name: "cart" },
	),
);

/** Total number of units across all lines. */
export function cartCount(items: CartItem[]) {
	return items.reduce((sum, line) => sum + line.quantity, 0);
}

/** Cart subtotal in cents. */
export function cartTotalCents(items: CartItem[]) {
	return items.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
}

export function cartDisplayTotalCents(items: CartItem[]) {
	return items.reduce(
		(sum, line) => sum + displayedUnitPrice(line.priceCents, line.productFees) * line.quantity,
		0,
	);
}
