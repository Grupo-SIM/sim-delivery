import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	useGetProductsByProductIdOptionGroups,
	usePutProductsByProductIdOptionGroups,
} from "@/lib/api";
import { showToast } from "@/stores";
import { OptionGroupPreviews } from "./OptionGroupPreviews";
import { type OptionGroup, OptionGroupEditor } from "./OptionGroupEditor";
import type { Product } from "./types";

interface ProductOptionsEditorProps {
	onReadyChange: (ready: boolean) => void;
	product: Product | null;
}

export interface ProductOptionsEditorHandle {
	save: () => Promise<void>;
}

export const ProductOptionsEditor = forwardRef<ProductOptionsEditorHandle, ProductOptionsEditorProps>(
	function ProductOptionsEditor({ onReadyChange, product }, ref) {
		const { t } = useTranslation();
		const [name, setName] = useState("");
		const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
		const [draftGroups, setDraftGroups] = useState<OptionGroup[]>([]);
		const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
		const groups = useGetProductsByProductIdOptionGroups(product?.id);
		const saveOptionGroups = usePutProductsByProductIdOptionGroups();
		const normalizeGroups = (): OptionGroup[] =>
			(groups.data ?? []).map(group => ({
				...group,
				maxSelect: Number(group.maxSelect),
				options: group.options.map(option => ({
					...option,
					priceDeltaCents: Number(option.priceDeltaCents),
					sortOrder: Number(option.sortOrder),
				})),
				priceRule: group.priceRule as OptionGroup["priceRule"],
				required: group.required,
				selectionType: group.selectionType as OptionGroup["selectionType"],
				sortOrder: Number(group.sortOrder),
			}));
		useEffect(() => {
			onReadyChange(groups.data !== undefined && !groups.isError);
		}, [groups.data, groups.isError, onReadyChange]);
		useEffect(() => {
			if (!groups.data) return;
			setDraftGroups(
				groups.data.map(group => ({
					...group,
					maxSelect: Number(group.maxSelect),
					options: group.options.map(option => ({
						...option,
						priceDeltaCents: Number(option.priceDeltaCents),
						sortOrder: Number(option.sortOrder),
					})),
					priceRule: group.priceRule as OptionGroup["priceRule"],
					required: group.required,
					selectionType: group.selectionType as OptionGroup["selectionType"],
					sortOrder: Number(group.sortOrder),
				})),
			);
		}, [groups.data]);

		function addGroup() {
			flushName();
			if (!name.trim() || !product) return;
			setDraftGroups(current => [
				...current,
				{
					id: crypto.randomUUID(),
					maxSelect: 1,
					name: name.trim(),
					options: [],
					priceRule: "sum",
					required: false,
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
			if (!product || !groups.data) throw new Error("Option groups are not loaded");
			const productId = product.id;
			const originals = normalizeGroups();
			await saveOptionGroups.mutateAsync({
				data: {
					groups: draftGroups.map(group => {
						const original = originals.find(item => item.id === group.id);
						return {
							...(original ? { id: group.id } : {}),
							maxSelect: group.maxSelect,
							name: group.name,
							options: group.options.map(option => ({
								...(original?.options.some(item => item.id === option.id) ? { id: option.id } : {}),
								available: option.available,
								description: option.description,
								imageUrl: option.imageUrl,
								name: option.name,
								priceDeltaCents: option.priceDeltaCents,
								sortOrder: option.sortOrder,
							})),
							priceRule: group.priceRule,
							required: group.required,
							selectionType: group.selectionType,
							sortOrder: group.sortOrder,
						};
					}),
				},
				productId,
			});
			showToast(t("admin.products.options.saved"), "positive");
		}

		useImperativeHandle(ref, () => ({ save }));

		if (!product) return null;

		return (
			<div className="space-y-4 border-border border-t pt-4">
				<h3 className="font-semibold">{t("admin.products.options.title")}</h3>
				{groups.isPending ? (
					<OptionGroupPreviews groups={product.optionGroups} pending />
				) : groups.isError ? (
					<div className="space-y-3">
						<OptionGroupPreviews groups={product.optionGroups} />
						<p className="text-destructive text-xs">{t("admin.products.options.loadError")}</p>
					</div>
				) : (
					<>
				<div className="flex gap-2">
					<Input
						onBlur={flushName}
						onChange={event => setLocalName(event.currentTarget.value)}
						placeholder={t("admin.products.options.groupPlaceholder")}
						value={localName}
					/>
					<Button
						className="shrink-0 px-4"
						disabled={saveOptionGroups.isPending || !localName.trim()}
						onClick={addGroup}
						type="button"
					>
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
					</>
				)}
			</div>
		);
	},
);
