import { beforeEach, describe, expect, it } from "bun:test";
import { type CartItemInput, makeLineKey, useCartStore } from "./cart";

const base: CartItemInput = {
	id: "up_1",
	imageUrl: "",
	options: [],
	priceCents: 1000,
	productId: "p_1",
	title: "Pizza",
};
const option = {
	groupId: "g_1",
	groupName: "Sabor",
	optionId: "o_1",
	optionName: "Calabresa",
	priceDeltaCents: 200,
	quantity: 1,
};

describe("cart store", () => {
	beforeEach(() => useCartStore.setState({ items: [], unitId: null }));

	it("uses deterministic option identity regardless of selection order", () => {
		expect(
			makeLineKey("up", [
				{ ...option, optionId: "b" },
				{ ...option, optionId: "a" },
			]),
		).toBe(
			makeLineKey("up", [
				{ ...option, optionId: "a" },
				{ ...option, optionId: "b" },
			]),
		);
	});

	it("merges matching selection combinations", () => {
		useCartStore.getState().addItem("u_1", { ...base, options: [option] }, 1);
		useCartStore.getState().addItem("u_1", { ...base, options: [option] }, 2);
		expect(useCartStore.getState().items).toHaveLength(1);
		expect(useCartStore.getState().items[0]?.quantity).toBe(3);
	});

	it("replaces a line and merges collision atomically", () => {
		useCartStore.getState().addItem("u_1", base, 1);
		useCartStore.getState().addItem("u_1", { ...base, options: [option] }, 2);
		const plain = useCartStore.getState().items.find(item => item.options.length === 0)!;
		useCartStore
			.getState()
			.replaceItem("u_1", plain.lineKey, { ...base, options: [option] }, 3, "sem cebola");
		expect(useCartStore.getState().items).toHaveLength(1);
		expect(useCartStore.getState().items[0]?.quantity).toBe(5);
	});
});
