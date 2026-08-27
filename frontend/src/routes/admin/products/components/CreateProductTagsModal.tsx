import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetTags } from "@/lib/api";

interface CreateProductTagsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (tagIds: string[]) => void;
	selectedTagIds: string[];
}

export function CreateProductTagsModal({
	isOpen,
	onClose,
	onSave,
	selectedTagIds,
}: CreateProductTagsModalProps) {
	const { t } = useTranslation();
	const { data: tags, isPending } = useGetTags();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	useEffect(() => {
		setSelectedIds(selectedTagIds);
	}, [selectedTagIds]);

	function toggle(tagId: string) {
		setSelectedIds(ids => (ids.includes(tagId) ? ids.filter(id => id !== tagId) : [...ids, tagId]));
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t("admin.products.create.tagsModalTitle")}
			urlKey="product-create-tags"
		>
			<div className="space-y-4">
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : tags && tags.length > 0 ? (
					<ScrollArea className="max-h-72 space-y-2 overflow-y-auto">
						{tags.map(tag => (
							<label
								className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 text-sm hover:border-border hover:bg-muted/40"
								htmlFor={`create-tag-${tag.id}`}
								key={tag.id}
							>
								<Checkbox
									checked={selectedIds.includes(tag.id)}
									id={`create-tag-${tag.id}`}
									onChange={() => toggle(tag.id)}
								/>
								<span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
								<span>{tag.name}</span>
							</label>
						))}
					</ScrollArea>
				) : (
					<p className="text-muted-foreground text-sm">{t("admin.products.create.tagsEmpty")}</p>
				)}
				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.products.create.modalCancel")}
					</Button>
					<Button disabled={isPending} onClick={() => onSave(selectedIds)} type="button">
						{t("admin.products.create.modalSave")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
