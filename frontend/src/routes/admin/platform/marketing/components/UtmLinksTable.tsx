import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuCopy, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Tooltip } from "@/components/ui/Tooltip";
import { getMarketingUtmLinksQueryKey, useDeleteMarketingUtmLinksById } from "@/lib/api";
import { showToast } from "@/stores";
import type { UtmLink } from "./UtmLinkForm";

interface UtmLinksTableProps {
	baseUrl: string;
	companyId: string;
	links: UtmLink[];
	onEdit: (link: UtmLink) => void;
}

export function UtmLinksTable({ baseUrl, companyId, links, onEdit }: UtmLinksTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeleteMarketingUtmLinksById();

	async function copy(path: string) {
		try {
			await navigator.clipboard.writeText(`${baseUrl}/utm/${path}`);
			showToast(t("admin.marketing.utm.copied"), "info");
		} catch {
			showToast(t("admin.marketing.utm.error"), "negative");
		}
	}

	if (!links.length) return <p className="text-muted-foreground text-sm">{t("admin.marketing.utm.empty")}</p>;
	return (
		<ScrollArea>
			<table className="w-full text-left text-sm">
				<thead className="text-muted-foreground text-xs uppercase">
					<tr>
						<th className="px-3 py-2">{t("admin.marketing.utm.fields.path")}</th>
						<th className="px-3 py-2">utm_source</th>
						<th className="px-3 py-2">utm_medium</th>
						<th className="px-3 py-2">utm_campaign</th>
						<th className="px-3 py-2">utm_content</th>
						<th className="px-3 py-2">{t("admin.marketing.utm.fields.unitSlug")}</th>
						<th className="px-3 py-2" />
					</tr>
				</thead>
				<tbody>
					{links.map(link => (
						<tr className="border-border/60 border-t" key={link.id}>
							<td className="px-3 py-2 font-medium">/utm/{link.path}</td>
							<td className="px-3 py-2">{link.source ?? "—"}</td>
							<td className="px-3 py-2">{link.medium ?? "—"}</td>
							<td className="px-3 py-2">{link.campaign ?? "—"}</td>
							<td className="px-3 py-2">{link.content ?? "—"}</td>
							<td className="px-3 py-2">{link.unitSlug ?? "—"}</td>
							<td className="flex justify-end gap-2 px-3 py-2">
								<Tooltip content={t("admin.marketing.utm.copy")}>
									<Button aria-label={t("admin.marketing.utm.copy")} onClick={() => void copy(link.path)} size="icon" type="button" variant="outline"><LuCopy className="size-4" /></Button>
								</Tooltip>
								<Tooltip content={t("admin.marketing.utm.edit")}>
									<Button aria-label={t("admin.marketing.utm.edit")} onClick={() => onEdit(link)} size="icon" type="button" variant="outline"><LuPencil className="size-4" /></Button>
								</Tooltip>
								<ConfirmActionButton
									aria-label={t("admin.marketing.utm.delete")}
									confirmation={t("admin.marketing.utm.deleteConfirmation")}
									confirmLabel={t("admin.marketing.utm.deleteConfirm")}
									idleIcon={<LuTrash2 className="size-4" />}
									onConfirm={() =>
										remove.mutate(
											{ id: link.id },
											{
												onError: () => showToast(t("admin.marketing.utm.error"), "negative"),
												onSuccess: async () => {
													await queryClient.invalidateQueries({ queryKey: getMarketingUtmLinksQueryKey({ companyId }) });
													showToast(t("admin.marketing.utm.deleted"), "positive");
												},
											},
										)
									}
									size="icon"
									type="button"
									variant="outline"
								>
									{null}
								</ConfirmActionButton>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</ScrollArea>
	);
}
