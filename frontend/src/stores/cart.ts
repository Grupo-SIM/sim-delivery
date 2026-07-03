import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A line in the cart. `id` is the unit-product association id (unique within a unit). */
export interface CartItem {
	id: string;
	imageUrl: string;
	note: string;
	priceCents: number;
	productId: string;
	quantity: number;
	title: string;
}

/** Fields needed to seed a new line; quantity/note are managed by the store. */
export type CartItemInput = Omit<CartItem, "note" | "quantity">;

export interface CartState {
	addItem: (unitId: string, item: CartItemInput) => void;
	clear: () => void;
	items: CartItem[];
	removeItem: (id: string) => void;
	setNote: (id: string, note: string) => void;
	setQuantity: (id: string, quantity: number) => void;
	/** The unit this cart belongs to; a cart holds items from a single unit at a time. */
	unitId: string | null;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			addItem: (unitId, item) =>
				set(state => {
					// Switching units starts a fresh cart (one unit at a time).
					const base = state.unitId === unitId ? state.items : [];
					const existing = base.find(line => line.id === item.id);
					const items = existing
						? base.map(line => (line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line))
						: [...base, { ...item, note: "", quantity: 1 }];
					return { items, unitId };
				}),
			clear: () => set({ items: [], unitId: null }),
			items: [],
			removeItem: id =>
				set(state => {
					const items = state.items.filter(line => line.id !== id);
					return { items, unitId: items.length === 0 ? null : state.unitId };
				}),
			setNote: (id, note) =>
				set(state => ({
					items: state.items.map(line => (line.id === id ? { ...line, note } : line)),
				})),
			setQuantity: (id, quantity) => {
				if (quantity <= 0) {
					get().removeItem(id);
					return;
				}
				set(state => ({
					items: state.items.map(line => (line.id === id ? { ...line, quantity } : line)),
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
