import { beforeEach, describe, expect, it } from "bun:test";
import { showAlert, showConfirm, useDialogStore } from "./dialog";

describe("dialog store", () => {
	beforeEach(() => useDialogStore.setState({ current: null }));

	it("starts with no open dialog", () => {
		expect(useDialogStore.getState().current).toBeNull();
	});

	it("opens a dialog with the given content", () => {
		void useDialogStore.getState().show("confirm", "Excluir produto?", "Atenção", "Excluir");

		expect(useDialogStore.getState().current).toMatchObject({
			confirmLabel: "Excluir",
			message: "Excluir produto?",
			title: "Atenção",
			type: "confirm",
		});
	});

	it("closes the dialog and resolves with the answer", async () => {
		const answer = useDialogStore.getState().show("confirm", "Excluir produto?");
		useDialogStore.getState().close(true);

		expect(await answer).toBe(true);
		expect(useDialogStore.getState().current).toBeNull();
	});

	it("resolves false when the dialog is dismissed", async () => {
		const answer = useDialogStore.getState().show("confirm", "Excluir produto?");
		useDialogStore.getState().close(false);

		expect(await answer).toBe(false);
	});

	it("stays pending until closed", async () => {
		const answer = useDialogStore.getState().show("confirm", "Excluir produto?");
		const settled = await Promise.race([answer, Promise.resolve("pending")]);

		expect(settled).toBe("pending");
		useDialogStore.getState().close(false);
		await answer;
	});

	it("closing with no open dialog is a no-op", () => {
		expect(() => useDialogStore.getState().close(true)).not.toThrow();
		expect(useDialogStore.getState().current).toBeNull();
	});

	it("does not resolve a dialog twice", async () => {
		let resolutions = 0;
		const answer = useDialogStore
			.getState()
			.show("confirm", "Excluir produto?")
			.then(value => {
				resolutions += 1;
				return value;
			});

		useDialogStore.getState().close(true);
		useDialogStore.getState().close(false);
		await answer;

		expect(resolutions).toBe(1);
	});
});

describe("showAlert", () => {
	beforeEach(() => useDialogStore.setState({ current: null }));

	it("opens an alert dialog", () => {
		void showAlert("Não foi possível salvar", "Erro");

		expect(useDialogStore.getState().current).toMatchObject({
			message: "Não foi possível salvar",
			title: "Erro",
			type: "alert",
		});
	});

	it("resolves with nothing once acknowledged", async () => {
		const acknowledged = showAlert("Não foi possível salvar");
		useDialogStore.getState().close(true);

		expect(await acknowledged).toBeUndefined();
	});
});

describe("showConfirm", () => {
	beforeEach(() => useDialogStore.setState({ current: null }));

	it("opens a confirm dialog", () => {
		void showConfirm("Excluir produto?", "Atenção", "Excluir");

		expect(useDialogStore.getState().current).toMatchObject({
			confirmLabel: "Excluir",
			type: "confirm",
		});
	});

	it("passes the user's answer through", async () => {
		const answer = showConfirm("Excluir produto?");
		useDialogStore.getState().close(true);

		expect(await answer).toBe(true);
	});
});
