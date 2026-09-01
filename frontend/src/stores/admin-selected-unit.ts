import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminSelectedUnitState {
	unitId: string | null;
	setUnitId: (unitId: string) => void;
	clear: () => void;
}

/**
 * Working unit for staff whose access is limited to assigned units.
 * Kept separate from the customer's storefront selection.
 */
export const useAdminSelectedUnitStore = create<AdminSelectedUnitState>()(
	persist(
		set => ({
			clear: () => set({ unitId: null }),
			setUnitId: unitId => set({ unitId }),
			unitId: null,
		}),
		{ name: "admin-selected-unit" },
	),
);
