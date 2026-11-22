import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleModalSection } from "@/components/ui/CollapsibleModalSection";
import { RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { getMarketingUtmLinksQueryKey, usePatchMarketingUtmLinksById, usePostMarketingUtmLinks } from "@/lib/api";
import { showToast } from "@/stores";
import type { UtmLink } from "./types";

const EMPTY = { campaign: "", content: "", medium: "", path: "", source: "", url: "" };
type Fields = typeof EMPTY;

interface UtmLinkModalProps {
	editing: UtmLink | null;
	onClose: () => void;
}

/** Create/edit modal of a tracked `/utm/<path>` link. */
export function UtmLinkModal({ editing, onClose }: UtmLinkModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [fields, setFields] = useState<Fields>(() =>
		editing
			? { campaign: editing.campaign ?? "", content: editing.content ?? "", medium: editing.medium ?? "", path: editing.path, source: editing.source ?? "", url: editing.url ?? "" }
			: EMPTY,
	);
	const create = usePostMarketingUtmLinks();
	const update = usePatchMarketingUtmLinksById();
	const set = (key: keyof Fields) => (value: string) => setFields(previous => ({ ...previous, [key]: value }));
	const hasUtm = Boolean(fields.source || fields.medium || fields.campaign || fields.content);
	const utmSummary = [fields.source, fields.medium, fields.campaign, fields.content].filter(Boolean).join(" · ");

	function save() {
		const body = {
			campaign: fields.campaign || null,
			content: fields.content || null,
			medium: fields.medium || null,
			path: fields.path,
			source: fields.source || null,
			url: fields.url || null,
		};
		const options = {
			onError: (caught: { status?: number }) =>
				showToast(t(caught.status === 409 ? "admin.marketing.utm.pathTaken" : caught.status === 422 ? "admin.marketing.utm.invalid" : "admin.marketing.utm.error"), "negative"),
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: getMarketingUtmLinksQueryKey() });
				showToast(t("admin.marketing.utm.saved"), "positive");
				closeActiveModalHistory();
			},
		};
		if (editing) update.mutate({ data: body, id: editing.id }, options);
		else create.mutate({ data: body }, options);
	}

	return (
		<Modal isOpen maxWidth="720px" onClose={onClose} title={t(editing ? "admin.marketing.utm.editTitle" : "admin.marketing.utm.newTitle")} urlKey="utm-link" urlState={editing?.id ?? "new"}>
			<form
				className="space-y-6"
				onSubmit={event => {
					event.preventDefault();
					save();
				}}
			>
				<CollapsibleModalSection defaultOpen summary={fields.path ? `/utm/${fields.path}` : t("admin.marketing.utm.linkSummaryEmpty")} title={t("admin.marketing.utm.linkSection")}>
					<div className="space-y-1">
						<TextField
							label={<span>{t("admin.marketing.utm.fields.path")} <RequiredMark /></span>}
							name="path"
							onValueChange={set("path")}
							placeholder="influencers/fulano"
							required
							value={fields.path}
						/>
						<p className="text-muted-foreground text-xs">{t("admin.marketing.utm.pathHint")}</p>
					</div>
					<div className="space-y-1">
						<TextField label={t("admin.marketing.utm.fields.url")} name="url" onValueChange={set("url")} placeholder="https://loja.com/centro" value={fields.url} />
						<p className="text-muted-foreground text-xs">{t("admin.marketing.utm.urlHint")}</p>
					</div>
				</CollapsibleModalSection>
				<CollapsibleModalSection defaultOpen summary={utmSummary || t("admin.marketing.utm.paramsSummaryEmpty")} title={t("admin.marketing.utm.paramsSection")}>
					<div className="grid gap-4 sm:grid-cols-2">
						<TextField label="utm_source" name="utm_source" onValueChange={set("source")} placeholder="ig" value={fields.source} />
						<TextField label="utm_medium" name="utm_medium" onValueChange={set("medium")} placeholder="social" value={fields.medium} />
						<TextField label="utm_campaign" name="utm_campaign" onValueChange={set("campaign")} placeholder="branding_instagram" value={fields.campaign} />
						<TextField label="utm_content" name="utm_content" onValueChange={set("content")} placeholder="link_in_bio" value={fields.content} />
					</div>
				</CollapsibleModalSection>
				<div className="flex justify-end gap-2 border-border border-t pt-5">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">{t("actions.discard")}</Button>
					<Button disabled={create.isPending || update.isPending || !fields.path.trim() || !hasUtm} type="submit">{t("actions.save")}</Button>
				</div>
			</form>
		</Modal>
	);
}
