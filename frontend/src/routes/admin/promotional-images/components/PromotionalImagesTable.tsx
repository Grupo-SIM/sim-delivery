import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuStore, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
	type GetPromotionalImages200,
	getPromotionalImagesQueryKey,
	useDeletePromotionalImagesByPromotionalImageId,
} from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";
import { PromotionalImageEditModal } from "./PromotionalImageEditModal";
import { PromotionalImageUnitsModal } from "./PromotionalImageUnitsModal";

interface PromotionalImagesTableProps {
	images: GetPromotionalImages200;
}

export function PromotionalImagesTable({ images }: PromotionalImagesTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeletePromotionalImagesByPromotionalImageId();
	const [editing, setEditing] = useState<GetPromotionalImages200[number] | null>(null);
	const [assigning, setAssigning] = useState<GetPromotionalImages200[number] | null>(null);

	if (images.length === 0) return <EmptyState title={t("admin.promotionalImages.empty")} />;

	async function del(id: string, title: string) {
		if (!(await showConfirm(t("admin.promotionalImages.delete.confirm", { title })))) return;
		remove.mutate(
			{ promotionalImageId: id },
			{
				onError: () => void showAlert(t("admin.promotionalImages.delete.error")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getPromotionalImagesQueryKey() }),
			},
		);
	}

	return (
		<>
			<DataTable>
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="px-4 py-3">{t("admin.promotionalImages.columns.image")}</th>
						<th className="px-4 py-3">{t("admin.promotionalImages.columns.link")}</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{images.map(image => (
						<tr className="border-border/60 border-b last:border-0" key={image.id}>
							<td className="px-4 py-3">
								<div className="flex items-center gap-3">
									<img
										alt=""
										className="h-16 w-28 rounded border border-border object-cover"
										src={image.imageUrl}
									/>
									<span className="font-medium">{image.title}</span>
								</div>
							</td>
							<td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{image.linkUrl ?? "—"}</td>
							<td className="px-4 py-3">
								<div className="flex justify-end gap-2">
									<Button onClick={() => setAssigning(image)} size="sm" type="button" variant="outline">
										<LuStore />
										{t("admin.promotionalImages.units.action")}
									</Button>
									<Button onClick={() => setEditing(image)} size="sm" type="button" variant="outline">
										<LuPencil />
										{t("admin.promotionalImages.edit.action")}
									</Button>
									<Button
										onClick={() => void del(image.id, image.title)}
										size="sm"
										type="button"
										variant="outline"
									>
										<LuTrash2 />
										{t("admin.promotionalImages.delete.action")}
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</DataTable>
			<PromotionalImageEditModal image={editing} onClose={() => setEditing(null)} />
			<PromotionalImageUnitsModal image={assigning} onClose={() => setAssigning(null)} />
		</>
	);
}
