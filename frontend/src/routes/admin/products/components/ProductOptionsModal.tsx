import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	getProductsByProductIdOptionGroupsQueryKey,
	useDeleteProductsByProductIdOptionGroupsByGroupId,
	useDeleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId,
	useGetProductsByProductIdOptionGroups,
	usePatchProductsByProductIdOptionGroupsByGroupId,
	usePatchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId,
	usePostProductsByProductIdOptionGroups,
	usePostProductsByProductIdOptionGroupsByGroupIdOptions,
} from "@/lib/api";
import { showToast } from "@/stores";
import { type OptionGroup, OptionGroupEditor } from "./OptionGroupEditor";
import type { Product } from "./types";

interface ProductOptionsModalProps {
	onClose: () => void;
	product: Product | null;
}

export function ProductOptionsModal({ onClose, product }: ProductOptionsModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [draftGroups, setDraftGroups] = useState<OptionGroup[]>([]);
	const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
	const groups = useGetProductsByProductIdOptionGroups(product?.id);
	const createGroup = usePostProductsByProductIdOptionGroups();
	const createOption = usePostProductsByProductIdOptionGroupsByGroupIdOptions();
	const updateGroup = usePatchProductsByProductIdOptionGroupsByGroupId();
	const updateOption = usePatchProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId();
	const deleteGroup = useDeleteProductsByProductIdOptionGroupsByGroupId();
	const deleteOption = useDeleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId();
	const refresh = () =>
		product &&
		queryClient.invalidateQueries({ queryKey: getProductsByProductIdOptionGroupsQueryKey(product.id) });

	const normalizeGroups = (): OptionGroup[] =>
		(groups.data ?? []).map(group => ({
			...group,
			maxSelect: Number(group.maxSelect),
			minSelect: Number(group.minSelect),
			options: group.options.map(option => ({
				...option,
				maxPerItem: option.maxPerItem === null ? null : Number(option.maxPerItem),
				priceDeltaCents: Number(option.priceDeltaCents),
				sortOrder: Number(option.sortOrder),
			})),
			priceRule: group.priceRule as OptionGroup["priceRule"],
			selectionType: group.selectionType as OptionGroup["selectionType"],
			sortOrder: Number(group.sortOrder),
		}));
	useEffect(() => {
		setDraftGroups(
			(groups.data ?? []).map(group => ({
				...group,
				maxSelect: Number(group.maxSelect),
				minSelect: Number(group.minSelect),
				options: group.options.map(option => ({
					...option,
					maxPerItem: option.maxPerItem === null ? null : Number(option.maxPerItem),
					priceDeltaCents: Number(option.priceDeltaCents),
					sortOrder: Number(option.sortOrder),
				})),
				priceRule: group.priceRule as OptionGroup["priceRule"],
				selectionType: group.selectionType as OptionGroup["selectionType"],
				sortOrder: Number(group.sortOrder),
			})),
		);
	}, [groups.data]);

	if (!product) return null;

	function addGroup() {
		flushName();
		if (!name.trim() || !product) return;
		setDraftGroups(current => [
			...current,
			{
				id: crypto.randomUUID(),
				maxSelect: 1,
				minSelect: 0,
				name: name.trim(),
				options: [],
				priceRule: "sum",
				selectionType: "single",
				sortOrder: current.length,
			},
		]);
		setLocalName("");
	}

	function moveGroup(targetId: string) {
		if (!draggedGroupId || draggedGroupId === targetId) return;
		setDraftGroups(current => {
			const sourceIndex = current.findIndex(group => group.id === draggedGroupId);
			const targetIndex = current.findIndex(group => group.id === targetId);
			if (sourceIndex < 0 || targetIndex < 0) return current;
			const next = [...current];
			const [moved] = next.splice(sourceIndex, 1);
			next.splice(targetIndex, 0, moved);
			return next.map((group, index) => ({ ...group, sortOrder: index }));
		});
		setDraggedGroupId(null);
	}

	async function save() {
		if (!product) return;
		const productId = product.id;
		const originals = normalizeGroups();
		const draftIds = new Set(draftGroups.map(group => group.id));
		await Promise.all(
			originals
				.filter(group => !draftIds.has(group.id))
				.map(group => deleteGroup.mutateAsync({ groupId: group.id, productId })),
		);
		for (const group of draftGroups) {
			const original = originals.find(item => item.id === group.id);
			if (!original) {
				const created = await createGroup.mutateAsync({
					data: {
						maxSelect: group.maxSelect,
						minSelect: group.minSelect,
						name: group.name,
						priceRule: group.priceRule,
						selectionType: group.selectionType,
						sortOrder: group.sortOrder,
					},
					productId,
				});
				await Promise.all(
					group.options.map(option =>
						createOption.mutateAsync({
							data: {
								available: option.available,
								description: option.description,
								imageUrl: option.imageUrl,
								maxPerItem: option.maxPerItem,
								name: option.name,
								priceDeltaCents: option.priceDeltaCents,
								sortOrder: option.sortOrder,
							},
							groupId: created.id,
							productId,
						}),
					),
				);
				continue;
			}
			await updateGroup.mutateAsync({
				data: {
					maxSelect: group.maxSelect,
					minSelect: group.minSelect,
					name: group.name,
					priceRule: group.priceRule,
					selectionType: group.selectionType,
					sortOrder: group.sortOrder,
				},
				groupId: group.id,
				productId,
			});
			const optionIds = new Set(group.options.map(option => option.id));
			await Promise.all(
				original.options
					.filter(option => !optionIds.has(option.id))
					.map(option => deleteOption.mutateAsync({ groupId: group.id, optionId: option.id, productId })),
			);
			for (const option of group.options) {
				const existing = original.options.some(item => item.id === option.id);
				const data = {
					available: option.available,
					description: option.description,
					imageUrl: option.imageUrl,
					maxPerItem: option.maxPerItem,
					name: option.name,
					priceDeltaCents: option.priceDeltaCents,
					sortOrder: option.sortOrder,
				};
				if (existing)
					await updateOption.mutateAsync({ data, groupId: group.id, optionId: option.id, productId });
				else await createOption.mutateAsync({ data, groupId: group.id, productId });
			}
		}
		await refresh();
		showToast(t("admin.products.options.saved"), "positive");
		onClose();
	}

	return (
		<Modal isOpen onClose={onClose} title={t("admin.products.options.title", { title: product.title })}>
			<div className="space-y-4">
				<div className="flex gap-2">
					<Input
						onBlur={flushName}
						onChange={event => setLocalName(event.currentTarget.value)}
						placeholder={t("admin.products.options.groupPlaceholder")}
						value={localName}
					/>
					<Button disabled={createGroup.isPending || !localName.trim()} onClick={addGroup} type="button">
						{t("admin.products.options.addGroup")}
					</Button>
				</div>
				{draftGroups.map(group => (
					<OptionGroupEditor
						group={group}
						key={group.id}
						onChange={value =>
							setDraftGroups(current => current.map(item => (item.id === value.id ? value : item)))
						}
						onDelete={() => setDraftGroups(current => current.filter(item => item.id !== group.id))}
						onDragEnd={() => setDraggedGroupId(null)}
						onDragOver={event => event.preventDefault()}
						onDragStart={() => setDraggedGroupId(group.id)}
						onDrop={() => moveGroup(group.id)}
					/>
				))}
				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						Cancelar
					</Button>
					<Button onClick={() => void save()} type="button">
						Salvar
					</Button>
				</div>
			</div>
		</Modal>
	);
}
