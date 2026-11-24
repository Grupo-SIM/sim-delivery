import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_PRINTED_IDS = 500;

interface AutoPrintState {
	enabled: boolean;
	printedIds: string[];
	printer: string;
	/** Unit whose orders this station prints; empty means every unit the staff can see. */
	unitId: string;
	markPrinted: (ids: string[]) => void;
	setEnabled: (enabled: boolean) => void;
	setPrinter: (printer: string) => void;
	setUnitId: (unitId: string) => void;
}

/** Per-device auto-print settings plus the orders already printed, so reloads never reprint. */
export const useAutoPrintStore = create<AutoPrintState>()(
	persist(
		set => ({
			enabled: false,
			markPrinted: ids =>
				set(state => ({
					printedIds: [...new Set([...state.printedIds, ...ids])].slice(-MAX_PRINTED_IDS),
				})),
			printedIds: [],
			printer: "",
			setEnabled: enabled => set({ enabled }),
			setPrinter: printer => set({ printer }),
			setUnitId: unitId => set({ unitId }),
			unitId: "",
		}),
		{ name: "auto-print" },
	),
);
