import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuCopy, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { getMarketingUtmLinksQueryKey, useDeleteMarketingUtmLinksById } from "@/lib/api";
import { showToast } from "@/stores";
import type { UtmCompany, UtmLink } from "./types";

interface UtmLinkRowProps {
	companies: UtmCompany[];
	link: UtmLink;
	onEdit: () => void;
}

/** Compact read-only row: short link, applied UTMs and destination. Editing happens in the modal. */
export function UtmLinkRow({ companies, link, onEdit }: UtmLinkRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeleteMarketingUtmLinksById();
	const utms = [link.source, link.medium, link.campaign, link.content].filter(Boolean).join(" · ");

	const destinations = link.destinations
		.map(destination => `${companies.find(company => company.id === destination.companyId)?.name ?? ""}: ${destination.unitSlug ? `/${destination.unitSlug}` : destination.url}`)
		.join(" · ");

	async function copy() {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/utm/${link.path}`);
			showToast(t("admin.marketing.utm.copied"), "info");
		} catch {
			showToast(t("admin.marketing.utm.error"), "negative");
		}
	}

	return (
		<li className="flex items-center gap-3 rounded-brand border border-border bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-muted/35">
			<div className="min-w-0 flex-1">
				<h3 className="truncate font-semibold text-sm">/utm/{link.path}</h3>
				<p className="mt-0.5 truncate text-muted-foreground text-sm">{utms}</p>
				<p className="mt-0.5 truncate text-muted-foreground text-xs">→ {destinations || t("admin.marketing.utm.home")}</p>
			</div>
			<div className="flex shrink-0 gap-2">
				<Tooltip content={t("admin.marketing.utm.copy")}>
					<Button aria-label={t("admin.marketing.utm.copy")} onClick={() => void copy()} size="icon" type="button" variant="outline">
						<LuCopy className="size-4" />
					</Button>
				</Tooltip>
				<Tooltip content={t("admin.marketing.utm.edit")}>
					<Button aria-label={t("admin.marketing.utm.edit")} onClick={onEdit} size="icon" type="button" variant="outline">
						<LuPencil className="size-4" />
					</Button>
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
									await queryClient.invalidateQueries({ queryKey: getMarketingUtmLinksQueryKey() });
									showToast(t("admin.marketing.utm.deleted"), "positive");
								},
							},
						)
					}
					size="icon"
					tooltip={t("admin.marketing.utm.delete")}
					type="button"
					variant="outline"
				>
					<span className="sr-only">{t("admin.marketing.utm.delete")}</span>
				</ConfirmActionButton>
			</div>
		</li>
	);
}
