import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuGripVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import { AssociatedProducts, ProductAvailabilityBulkActions } from "@/components/products";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetCategories200,
	getCategoriesQueryKey,
	useDeleteCategoriesByCategoryId,
	usePatchCategoriesByCategoryId,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

interface CategoryRowProps {
	canManage: boolean;
	canToggleAvailability: boolean;
	category: GetCategories200[number];
	dragDisabled: boolean;
}

export function CategoryRow({ canManage, canToggleAvailability, category, dragDisabled }: CategoryRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(category.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const iconOnlyActions = canManage && canToggleAvailability;
	const { isPending, mutate } = usePatchCategoriesByCategoryId();
	const remove = useDeleteCategoriesByCategoryId();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });
	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
		disabled: dragDisabled,
		id: category.id,
	});

	function cancel() {
		setName(category.name);
		setEditing(false);
	}

	function save() {
		flushName();
		mutate(
			{ categoryId: category.id, data: { name: localName } },
			{
				onError: () => showToast(t("admin.categories.edit.error"), "negative"),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
				},
			},
		);
	}

	function del() {
		remove.mutate(
			{ categoryId: category.id },
			{
				onError: () => void showAlert(t("admin.categories.row.deleteError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.categories.row.deleteSuccess"), "positive");
				},
			},
		);
	}

	return (
		<tr
			className={`border-border/60 border-b last:border-0 ${isDragging ? "opacity-40" : "opacity-100"}`}
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			{canManage && (
				<td className="w-10 px-2 py-3">
					<Tooltip content={t("admin.categories.order.reorder")}>
						<button
							{...attributes}
							{...listeners}
							aria-label={t("admin.categories.order.reorder")}
							className="grid size-9 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
							disabled={dragDisabled}
							type="button"
						>
							<LuGripVertical className="size-4" />
						</button>
					</Tooltip>
				</td>
			)}
			<td className="w-56 px-4 py-3 font-medium">
				{editing ? (
					<div className="grid rounded-md border border-primary/50 bg-primary/5 px-1.5 py-0.5 shadow-sm">
						<span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">
							{category.name || " "}
						</span>
						<Input
							aria-label={t("admin.categories.create.name")}
							className="col-start-1 row-start-1 h-auto min-w-32 rounded-none border-0 bg-transparent p-0 font-medium leading-[inherit] shadow-none focus-visible:ring-0"
							name="category-name"
							onBlur={flushName}
							onChange={event => setLocalName(event.currentTarget.value)}
							placeholder={t("admin.categories.create.namePlaceholder")}
							value={localName}
						/>
					</div>
				) : (
					category.name
				)}
			</td>
			<td className="w-56 px-4 py-3">
				<AssociatedProducts
					association="category"
					canManage={canManage}
					modalTitle={t("admin.categories.products.modalTitle", { name: category.name })}
					products={category.products}
					urlKey="category-products"
					urlState={category.id}
					viewLabel={t("admin.categories.products.viewButton", { count: category.products.length })}
				/>
			</td>
			{(canManage || canToggleAvailability) && (
				<td className="w-56 px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						{canToggleAvailability && (
							<ProductAvailabilityBulkActions
								iconOnly={iconOnlyActions}
								scope={{ categoryId: category.id }}
							/>
						)}
						{canManage &&
							(editing ? (
								<>
									<Button disabled={isPending} onClick={cancel} size="sm" type="button" variant="outline">
										{t("admin.categories.edit.cancel")}
									</Button>
									<Button disabled={isPending || !localName.trim()} onClick={save} size="sm" type="button">
										{isPending ? t("admin.categories.edit.saving") : t("admin.categories.edit.save")}
									</Button>
								</>
							) : (
								<>
									{iconOnlyActions ? (
										<Tooltip content={t("admin.categories.edit.action")}>
											<Button
												aria-label={t("admin.categories.edit.action")}
												onClick={() => setEditing(true)}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuPencil className="size-4" />
											</Button>
										</Tooltip>
									) : (
										<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
											<LuPencil className="size-4" />
											{t("admin.categories.edit.action")}
										</Button>
									)}
									<ConfirmActionButton
										aria-label={t("admin.categories.row.delete")}
										confirmation={t("admin.categories.row.deleteConfirm", { name: category.name })}
										confirmLabel={t("admin.categories.row.delete")}
										disabled={remove.isPending}
										idleIcon={<LuTrash2 className="size-4" />}
										onConfirm={del}
										size={iconOnlyActions ? "icon" : "sm"}
										tooltip={iconOnlyActions ? t("admin.categories.row.delete") : undefined}
										type="button"
										variant="outline"
									>
										{iconOnlyActions ? null : t("admin.categories.row.delete")}
									</ConfirmActionButton>
								</>
							))}
					</div>
				</td>
			)}
		</tr>
	);
}
