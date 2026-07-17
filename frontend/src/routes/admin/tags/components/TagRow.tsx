import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/ui/ColorField";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetTags200, getTagsQueryKey, useDeleteTagsByTagId, usePatchTagsByTagId } from "@/lib/api";
import { showAlert, showConfirm, showToast } from "@/stores";

interface TagRowProps {
	tag: GetTags200[number];
}

export function TagRow({ tag }: TagRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(tag.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [color, setColor] = useState(tag.color);
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

	async function del() {
		if (!(await showConfirm(t("admin.tags.row.deleteConfirm", { name: tag.name })))) return;
		remove.mutate(
			{ tagId: tag.id },
			{
				onError: () => void showAlert(t("admin.tags.row.deleteError")),
				onSuccess: () => invalidate(),
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
				<div className="flex max-w-80 flex-wrap gap-1.5">
					{tag.products.length === 0 ? (
						<span className="text-muted-foreground text-sm">{t("admin.tags.products.empty")}</span>
					) : (
						tag.products.map(product => (
							<Badge key={product.id} tone="neutral">
								{product.title}
							</Badge>
						))
					)}
				</div>
			</td>
			<td className="w-56 px-4 py-3 text-right">
				<div className="flex justify-end gap-2">
					{editing ? (
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
							<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
								<LuPencil className="size-4" />
								{t("admin.tags.edit.action")}
							</Button>
							<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
								<LuTrash2 className="size-4" />
								{t("admin.tags.row.delete")}
							</Button>
						</>
					)}
				</div>
			</td>
		</tr>
	);
}
