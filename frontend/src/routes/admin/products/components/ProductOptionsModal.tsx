import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	getProductsByProductIdOptionGroupsQueryKey,
	useGetProductsByProductIdOptionGroups,
	usePostProductsByProductIdOptionGroups,
} from "@/lib/api";
import { showToast } from "@/stores";
import { OptionGroupEditor } from "./OptionGroupEditor";
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
	const groups = useGetProductsByProductIdOptionGroups(product?.id);
	const createGroup = usePostProductsByProductIdOptionGroups();
	const refresh = () =>
		product &&
		queryClient.invalidateQueries({ queryKey: getProductsByProductIdOptionGroupsQueryKey(product.id) });

	if (!product) return null;

	function addGroup() {
		flushName();
		if (!name.trim() || !product) return;
		createGroup.mutate(
			{
				data: { maxSelect: 1, minSelect: 0, name: name.trim(), priceRule: "sum", selectionType: "single" },
				productId: product.id,
			},
			{
				onSuccess: () => {
					setLocalName("");
					void refresh();
					showToast(t("admin.products.options.groupCreated"), "positive");
				},
			},
		);
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
				{groups.data?.map(group => (
					<OptionGroupEditor
						group={{
							...group,
							maxSelect: Number(group.maxSelect),
							minSelect: Number(group.minSelect),
							options: group.options.map(option => ({
								...option,
								maxPerItem: option.maxPerItem === null ? null : Number(option.maxPerItem),
								priceDeltaCents: Number(option.priceDeltaCents),
								sortOrder: Number(option.sortOrder),
							})),
							sortOrder: Number(group.sortOrder),
						}}
						key={group.id}
						onChange={refresh}
						productId={product.id}
					/>
				))}
			</div>
		</Modal>
	);
}
