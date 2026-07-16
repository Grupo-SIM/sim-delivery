import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedUnit {
	id: string;
	name: string;
	slug: string;
}

interface SelectedUnitState {
	/** The unit the customer is currently ordering from; null until one is chosen. */
	unit: SelectedUnit | null;
	setUnit: (unit: SelectedUnit) => void;
	clear: () => void;
}

/**
 * Persists the chosen unit (localStorage) so it survives reloads and later visits.
 * A unit is required before checkout; this remembers the customer's last choice.
 */
export const useSelectedUnitStore = create<SelectedUnitState>()(
	persist(
		set => ({
			clear: () => set({ unit: null }),
			setUnit: unit => set({ unit }),
			unit: null,
		}),
		{ name: "selected-unit" },
	),
);
