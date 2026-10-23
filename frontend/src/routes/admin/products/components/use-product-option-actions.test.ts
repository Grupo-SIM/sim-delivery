import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { OptionGroup } from "./OptionGroupEditor";

const actualReact = await import("react");

const savedOption = {
	available: true,
	description: "Tradicional",
	id: "option",
	imageUrl: null,
	name: "Atum",
	priceDeltaCents: 0,
	sortOrder: 0,
};
const savedGroup: OptionGroup = {
	allowRepeatSelection: false,
	id: "group",
	maxSelect: 1,
	name: "Sabores",
	options: [savedOption],
	priceRule: "sum",
	required: true,
	sortOrder: 0,
};
let cache: OptionGroup[];
const updateOption = mock(async (..._args: unknown[]) => ({}));
const updateGroup = mock(async (..._args: unknown[]) => ({}));
const createGroup = mock(async (..._args: unknown[]) => ({ id: "created-group" }));
const createOption = mock(async (..._args: unknown[]) => ({ id: "created-option" }));
const deleteGroup = mock(async (..._args: unknown[]) => ({}));
const deleteOption = mock(async (..._args: unknown[]) => ({}));
const toast = mock((..._args: unknown[]) => {});
const invalidate = mock(async (..._args: unknown[]) => {});
mock.module("react", () => ({
	...actualReact,
	useRef: <T>(current: T) => ({ current }),
	useState: <T>(value: T) => [value, () => {}],
}));
mock.module("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
mock.module("@tanstack/react-query", () => ({
	useQueryClient: () => ({
		cancelQueries: async () => {},
		invalidateQueries: invalidate,
		setQueryData: (_key: unknown, update: (current: OptionGroup[]) => OptionGroup[]) => {
			cache = update(cache);
		},
	}),
}));
mock.module("@/stores", () => ({ showToast: toast }));
mock.module("@/lib/api", () => ({
	deleteProductsByProductIdOptionGroupsByGroupId: deleteGroup,
	deleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId: deleteOption,
	getProductsByProductIdOptionGroupsQueryKey: (id: string) => ["Products", `/products/${id}/option-groups`],
	getProductsQueryKey: () => ["Products", "/products"],
	patchProductsByProductIdOptionGroupsByGroupId: updateGroup,
	patchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId: updateOption,
	postProductsByProductIdOptionGroups: createGroup,
	postProductsByProductIdOptionGroupsByGroupIdOptions: createOption,
	useGetProductsByProductIdOptionGroups: () => ({ data: cache }),
}));
const { useProductOptionActions } = await import("./use-product-option-actions");

beforeEach(() => {
	cache = structuredClone([savedGroup]);
	for (const fn of [
		updateOption,
		updateGroup,
		createGroup,
		createOption,
		deleteGroup,
		deleteOption,
		toast,
		invalidate,
	])
		fn.mockClear();
});
describe("independent option persistence", () => {
	it("persists uploaded photo without saving group or product", async () => {
		const actions = useProductOptionActions("product");
		const option = { ...savedOption, imageUrl: "https://example.com/atum.webp" };
		expect(await actions.saveOption("group", option)).toBe(true);
		expect(updateOption).toHaveBeenCalledWith(
			"product",
			"group",
			"option",
			expect.objectContaining({ imageUrl: option.imageUrl }),
		);
		expect(updateGroup).not.toHaveBeenCalled();
		expect(cache[0].options[0].imageUrl).toBe(option.imageUrl);
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ["Products", "/products"], refetchType: "none" });
	});
	it("saving stale group draft preserves already saved option photo", async () => {
		const actions = useProductOptionActions("product");
		await actions.saveOption("group", { ...savedOption, imageUrl: "https://example.com/new.webp" });
		await actions.saveGroup({ ...savedGroup, name: "Escolha seu sabor" });
		expect(updateGroup).toHaveBeenCalledWith(
			"product",
			"group",
			expect.not.objectContaining({ options: expect.anything() }),
		);
		expect(cache[0].name).toBe("Escolha seu sabor");
		expect(cache[0].options[0].imageUrl).toBe("https://example.com/new.webp");
	});
	it("keeps saved photo when request fails and reports failure", async () => {
		updateOption.mockRejectedValueOnce(new Error("offline"));
		expect(
			await useProductOptionActions("product").saveOption("group", {
				...savedOption,
				imageUrl: "https://example.com/failed.webp",
			}),
		).toBe(false);
		expect(cache[0].options[0].imageUrl).toBeNull();
		expect(toast).toHaveBeenLastCalledWith("admin.products.options.saveError", "negative");
	});
	it("uses server IDs for new groups and options", async () => {
		const actions = useProductOptionActions("product");
		await actions.addGroup("Extras");
		await actions.addOption("created-group", savedOption);
		expect(cache[1].id).toBe("created-group");
		expect(cache[1].options[0].id).toBe("created-option");
		expect(createOption).toHaveBeenCalledWith(
			"product",
			"created-group",
			expect.not.objectContaining({ id: expect.anything() }),
		);
	});
	it("deletes option without saving parent and persists ordering", async () => {
		const actions = useProductOptionActions("product");
		await actions.reorderOptions("group", [savedOption]);
		expect(updateOption).toHaveBeenCalledWith("product", "group", "option", { sortOrder: 0 });
		await actions.deleteOption("group", "option");
		expect(cache[0].options).toEqual([]);
		expect(updateGroup).not.toHaveBeenCalled();
	});
});


describe("imported IDs containing path separators", () => {
	it("encodes request IDs while preserving raw cache IDs", async () => {
		const groupId = "size/product";
		const optionId = "size-option/product";
		const option = { ...savedOption, id: optionId };
		const group = { ...savedGroup, id: groupId, options: [option] };
		cache = [group];
		const actions = useProductOptionActions("product");
		await actions.saveOption(groupId, option);
		expect(updateOption).toHaveBeenLastCalledWith("product", "size%2Fproduct", "size-option%2Fproduct", expect.anything());
		await actions.saveGroup(group);
		expect(updateGroup).toHaveBeenLastCalledWith("product", "size%2Fproduct", expect.anything());
		await actions.reorderOptions(groupId, [option]);
		expect(updateOption).toHaveBeenLastCalledWith("product", "size%2Fproduct", "size-option%2Fproduct", { sortOrder: 0 });
		await actions.reorderGroups([group]);
		expect(updateGroup).toHaveBeenLastCalledWith("product", "size%2Fproduct", { sortOrder: 0 });
		expect(cache[0].id).toBe(groupId);
		expect(cache[0].options[0].id).toBe(optionId);
		await actions.addOption(groupId, savedOption);
		expect(createOption).toHaveBeenLastCalledWith("product", "size%2Fproduct", expect.anything());
		await actions.deleteOption(groupId, optionId);
		expect(deleteOption).toHaveBeenLastCalledWith("product", "size%2Fproduct", "size-option%2Fproduct");
		expect(cache[0].options.map(item => item.id)).toEqual(["created-option"]);
		await actions.deleteGroup(groupId);
		expect(deleteGroup).toHaveBeenLastCalledWith("product", "size%2Fproduct");
		expect(cache).toEqual([]);
	});
});
