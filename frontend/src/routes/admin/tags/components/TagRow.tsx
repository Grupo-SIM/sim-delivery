import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetTags200, getTagsQueryKey, useDeleteTagsByTagId, usePatchTagsByTagId } from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";
import { ColorField } from "./ColorField";

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
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePatchTagsByTagId();
	const remove = useDeleteTagsByTagId();

	const invalidate = () => queryClient.invalidateQueries({ queryKey: getTagsQueryKey() });

	function save() {
		flushName();
		setError(null);
		mutate(
			{ data: { color, name: localName }, tagId: tag.id },
			{
				onError: () => setError(t("admin.tags.edit.error")),
				onSuccess: async () => {
					setEditing(false);
					await invalidate();
				},
			},
		);
	}

	async function del() {
		if (!(await showConfirm(t("admin.tags.row.deleteConfirm", { name: tag.name })))) {
			return;
		}
		remove.mutate(
			{ tagId: tag.id },
			{
				onError: () => void showAlert(t("admin.tags.row.deleteError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	if (!editing) {
		return (
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">{tag.name}</td>
				<td className="px-4 py-3">
					<span className="inline-flex items-center gap-2 text-muted-foreground">
						<span
							aria-hidden
							className="inline-block h-4 w-4 rounded-full border border-border"
							style={{ backgroundColor: tag.color }}
						/>
						{tag.color}
					</span>
				</td>
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							{t("admin.tags.edit.action")}
						</Button>
						<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
							{t("admin.tags.row.delete")}
						</Button>
					</div>
				</td>
			</tr>
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3">
				<Input
					onBlur={flushName}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.tags.create.namePlaceholder")}
					value={localName}
				/>
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</td>
			<td className="px-4 py-3">
				<ColorField onChange={setColor} value={color} />
			</td>
			<td className="px-4 py-3">
				<div className="flex justify-end gap-2">
					<Button
						disabled={isPending}
						onClick={() => {
							setName(tag.name);
							setColor(tag.color);
							setError(null);
							setEditing(false);
						}}
						size="sm"
						type="button"
						variant="outline"
					>
						{t("admin.tags.edit.cancel")}
					</Button>
					<Button disabled={isPending || !localName} onClick={save} size="sm" type="button">
						{isPending ? t("admin.tags.edit.saving") : t("admin.tags.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
