import { create } from "zustand";

interface DialogEntry {
	message: string;
	resolve: (value: boolean) => void;
	title?: string;
	type: "alert" | "confirm";
	confirmLabel?: string;
}

interface DialogStore {
	current: DialogEntry | null;
	close: (value: boolean) => void;
	show: (
		type: "alert" | "confirm",
		message: string,
		title?: string,
		confirmLabel?: string,
	) => Promise<boolean>;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
	close(value) {
		const { current } = get();
		if (!current) return;
		current.resolve(value);
		set({ current: null });
	},
	current: null,

	show(type, message, title, confirmLabel) {
		return new Promise<boolean>(resolve => {
			set({ current: { confirmLabel, message, resolve, title, type } });
		});
	},
}));

export function showAlert(message: string, title?: string): Promise<void> {
	return useDialogStore
		.getState()
		.show("alert", message, title)
		.then(() => undefined);
}

export function showConfirm(message: string, title?: string, confirmLabel?: string): Promise<boolean> {
	return useDialogStore.getState().show("confirm", message, title, confirmLabel);
}
