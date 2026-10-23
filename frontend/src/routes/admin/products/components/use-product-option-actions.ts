import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	deleteProductsByProductIdOptionGroupsByGroupId,
	deleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId,
	getProductsByProductIdOptionGroupsQueryKey,
	getProductsQueryKey,
	patchProductsByProductIdOptionGroupsByGroupId,
	patchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId,
	postProductsByProductIdOptionGroups,
	postProductsByProductIdOptionGroupsByGroupIdOptions,
	useGetProductsByProductIdOptionGroups,
} from "@/lib/api";
import { showToast } from "@/stores";
import type { EditableOption } from "./OptionEditor";
import type { OptionGroup } from "./OptionGroupEditor";

export function useProductOptionActions(productId: string | undefined) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const query = useGetProductsByProductIdOptionGroups(productId);
	const [isSaving, setIsSaving] = useState(false);
	const busy = useRef(false);
	const groups: OptionGroup[] = (query.data ?? []).map(group => ({
		...group,
		maxSelect: group.maxSelect == null ? null : Number(group.maxSelect),
		options: group.options.map(option => ({
			...option,
			priceDeltaCents: Number(option.priceDeltaCents),
			sortOrder: Number(option.sortOrder),
		})),
		priceRule: group.priceRule as OptionGroup["priceRule"],
		sortOrder: Number(group.sortOrder),
	}));

	async function run(operation: () => Promise<void>) {
		if (!productId || busy.current) return false;
		busy.current = true;
		setIsSaving(true);
		try {
			await queryClient.cancelQueries({ queryKey: getProductsByProductIdOptionGroupsQueryKey(productId) });
			await operation();
			await queryClient.invalidateQueries({ queryKey: getProductsQueryKey(), refetchType: "none" });
			showToast(t("admin.products.options.saved"), "positive");
			return true;
		} catch {
			showToast(t("admin.products.options.saveError"), "negative");
			return false;
		} finally {
			busy.current = false;
			setIsSaving(false);
		}
	}
	function updateGroups(update: (current: OptionGroup[]) => OptionGroup[]) {
		queryClient.setQueryData<OptionGroup[]>(getProductsByProductIdOptionGroupsQueryKey(productId), current =>
			update(current ?? []),
		);
	}
	function updateOptions(groupId: string, update: (options: EditableOption[]) => EditableOption[]) {
		updateGroups(current =>
			current.map(group => (group.id === groupId ? { ...group, options: update(group.options) } : group)),
		);
	}
	return {
		addGroup: (name: string) =>
			run(async () => {
				const data = {
					allowRepeatSelection: false,
					maxSelect: null,
					name,
					priceRule: "sum" as const,
					required: false,
					sortOrder: groups.length,
				};
				const created = await postProductsByProductIdOptionGroups(productId!, data);
				updateGroups(current => [...current, { ...data, id: created.id, options: [] }]);
			}),
		addOption: (groupId: string, option: EditableOption) =>
			run(async () => {
				const { id: _id, ...data } = option;
				const created = await postProductsByProductIdOptionGroupsByGroupIdOptions(productId!, encodeURIComponent(groupId), data);
				updateOptions(groupId, current => [...current, { ...data, id: created.id }]);
			}),
		deleteGroup: (groupId: string) =>
			run(async () => {
				await deleteProductsByProductIdOptionGroupsByGroupId(productId!, encodeURIComponent(groupId));
				updateGroups(current => current.filter(group => group.id !== groupId));
			}),
		deleteOption: (groupId: string, optionId: string) =>
			run(async () => {
				await deleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId(productId!, encodeURIComponent(groupId), encodeURIComponent(optionId));
				updateOptions(groupId, current => current.filter(option => option.id !== optionId));
			}),
		groups,
		isSaving,
		query,
		reorderGroups: (ordered: OptionGroup[]) =>
			run(async () => {
				await Promise.all(
					ordered.map((group, sortOrder) =>
						patchProductsByProductIdOptionGroupsByGroupId(productId!, encodeURIComponent(group.id), { sortOrder }),
					),
				);
				updateGroups(() => ordered.map((group, sortOrder) => ({ ...group, sortOrder })));
			}),
		reorderOptions: (groupId: string, ordered: EditableOption[]) =>
			run(async () => {
				await Promise.all(
					ordered.map((option, sortOrder) =>
						patchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId(productId!, encodeURIComponent(groupId), encodeURIComponent(option.id), {
							sortOrder,
						}),
					),
				);
				updateOptions(groupId, () => ordered.map((option, sortOrder) => ({ ...option, sortOrder })));
			}),
		saveGroup: (group: OptionGroup) =>
			run(async () => {
				const { id, allowRepeatSelection, maxSelect, name, priceRule, required, sortOrder } = group;
				const data = { allowRepeatSelection, maxSelect, name, priceRule, required, sortOrder };
				await patchProductsByProductIdOptionGroupsByGroupId(productId!, encodeURIComponent(id), data);
				updateGroups(current => current.map(item => (item.id === id ? { ...item, ...data } : item)));
			}),
		saveOption: (groupId: string, option: EditableOption) =>
			run(async () => {
				const { id, ...data } = option;
				await patchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId(productId!, encodeURIComponent(groupId), encodeURIComponent(id), data);
				updateOptions(groupId, current => current.map(item => (item.id === id ? option : item)));
			}),
	};
}
export type ProductOptionActions = ReturnType<typeof useProductOptionActions>;
