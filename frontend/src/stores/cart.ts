import { create } from "zustand";
import { persist } from "zustand/middleware";

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
	quantity: number;
	title: string;
}

/** Fields needed to seed a new line; quantity/note/lineKey are managed by the store. */
export type CartItemInput = Omit<CartItem, "lineKey" | "note" | "quantity">;

export interface CartState {
	addItem: (unitId: string, item: CartItemInput, quantity?: number, note?: string) => void;
	clear: () => void;
	items: CartItem[];
	removeItem: (lineKey: string) => void;
	replaceItem: (unitId: string, lineKey: string, item: CartItemInput, quantity: number, note: string) => void;
	setNote: (lineKey: string, note: string) => void;
	setQuantity: (lineKey: string, quantity: number) => void;
	/** The unit this cart belongs to; a cart holds items from a single unit at a time. */
	unitId: string | null;
}

function makeLineKey(id: string, options: SelectedOption[]): string {
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
					return { items, unitId };
				}),
			clear: () => set({ items: [], unitId: null }),
			items: [],
			removeItem: lineKey =>
				set(state => {
					const items = state.items.filter(line => line.lineKey !== lineKey);
					return { items, unitId: items.length === 0 ? null : state.unitId };
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
					return { items, unitId };
				}),
			setNote: (lineKey, note) =>
				set(state => ({
					items: state.items.map(line => (line.lineKey === lineKey ? { ...line, note } : line)),
				})),
			setQuantity: (lineKey, quantity) => {
				if (quantity <= 0) {
					get().removeItem(lineKey);
					return;
				}
				set(state => ({
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
