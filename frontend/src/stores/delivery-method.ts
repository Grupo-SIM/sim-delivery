import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeliveryMethod = "delivery" | "pickup";

interface DeliveryMethodState {
	methods: Record<string, DeliveryMethod>;
	getMethod: (unitId: string, available: string[]) => DeliveryMethod;
	setMethod: (unitId: string, method: DeliveryMethod) => void;
}

export const useDeliveryMethodStore = create<DeliveryMethodState>()(
	persist(
		(set, get) => ({
			methods: {},
			getMethod: (unitId, available) => {
				const saved = get().methods[unitId];
				if (saved && available.includes(saved)) return saved;
				return available.includes("delivery") ? "delivery" : "pickup";
			},
			setMethod: (unitId, method) =>
				set(state => ({ methods: { ...state.methods, [unitId]: method } })),
		}),
		{ name: "delivery-method" },
	),
);
