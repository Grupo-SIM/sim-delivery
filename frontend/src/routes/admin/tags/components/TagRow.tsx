import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { AssociatedProducts, ProductAvailabilityBulkActions } from "@/components/products";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/ui/ColorField";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetTags200, getTagsQueryKey, useDeleteTagsByTagId, usePatchTagsByTagId } from "@/lib/api";
import { showAlert, showToast } from "@/stores";

interface TagRowProps {
	canManage: boolean;
	canToggleAvailability: boolean;
	tag: GetTags200[number];
}

export function TagRow({ canManage, canToggleAvailability, tag }: TagRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(tag.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [color, setColor] = useState(tag.color);
	const hasBulkAction = canToggleAvailability && tag.products.length > 0;
	const iconOnlyActions = canManage && hasBulkAction;
	const { isPending, mutate } = usePatchTagsByTagId();
	const remove = useDeleteTagsByTagId();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getTagsQueryKey() });

	function cancel() {
		setName(tag.name);
		setColor(tag.color);
		setEditing(false);
	}

	function save() {
		flushName();
		mutate(
			{ data: { color, name: localName }, tagId: tag.id },
			{
				onError: () => showToast(t("admin.tags.edit.error"), "negative"),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
				},
			},
		);
	}

	function del() {
		remove.mutate(
			{ tagId: tag.id },
			{
				onError: () => void showAlert(t("admin.tags.row.deleteError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.tags.row.deleteSuccess"), "positive");
				},
			},
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="w-56 px-4 py-3 font-medium">
				{editing ? (
					<div className="grid">
						<span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">
							{tag.name || " "}
						</span>
						<Input
							className="col-start-1 row-start-1 h-auto min-w-32 rounded-none border-0 bg-transparent p-0 font-medium leading-[inherit] shadow-none focus-visible:ring-0"
							onBlur={flushName}
							onChange={event => setLocalName(event.currentTarget.value)}
							placeholder={t("admin.tags.create.namePlaceholder")}
							value={localName}
						/>
					</div>
				) : (
					tag.name
				)}
			</td>
			<td className="w-52 px-4 py-3">
				{editing ? (
					<ColorField onChange={setColor} value={color} />
				) : (
					<span className="inline-flex h-11 items-center gap-2 text-muted-foreground">
						<span
							aria-hidden
							className="inline-block size-4 rounded-full border border-border"
							style={{ backgroundColor: tag.color }}
						/>
						{tag.color}
					</span>
				)}
			</td>
			<td className="px-4 py-3">
				<AssociatedProducts
					association="tag"
					canManage={canManage}
					modalTitle={t("admin.tags.products.modalTitle", { name: tag.name })}
					products={tag.products}
					urlKey="tag-products"
					urlState={tag.id}
					viewLabel={t("admin.tags.products.viewButton", { count: tag.products.length })}
				/>
			</td>
			{(canManage || canToggleAvailability) && (
				<td className="w-56 px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						{hasBulkAction && (
							<ProductAvailabilityBulkActions iconOnly={iconOnlyActions} scope={{ tagId: tag.id }} />
						)}
						{canManage &&
							(editing ? (
								<>
									<Button disabled={isPending} onClick={cancel} size="sm" type="button" variant="outline">
										{t("admin.tags.edit.cancel")}
									</Button>
									<Button disabled={isPending || !localName.trim()} onClick={save} size="sm" type="button">
										{isPending ? t("admin.tags.edit.saving") : t("admin.tags.edit.save")}
									</Button>
								</>
							) : (
								<>
									{iconOnlyActions ? (
										<Tooltip content={t("admin.tags.edit.action")}>
											<Button
												aria-label={t("admin.tags.edit.action")}
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
											{t("admin.tags.edit.action")}
										</Button>
									)}
									<ConfirmActionButton
										aria-label={t("admin.tags.row.delete")}
										confirmation={t("admin.tags.row.deleteConfirm", { name: tag.name })}
										confirmLabel={t("admin.tags.row.delete")}
										disabled={remove.isPending}
										idleIcon={<LuTrash2 className="size-4" />}
										onConfirm={del}
										size={iconOnlyActions ? "icon" : "sm"}
										tooltip={iconOnlyActions ? t("admin.tags.row.delete") : undefined}
										type="button"
										variant="outline"
									>
										{iconOnlyActions ? null : t("admin.tags.row.delete")}
									</ConfirmActionButton>
								</>
							))}
					</div>
				</td>
			)}
		</tr>
	);
}
