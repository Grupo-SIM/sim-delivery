import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RequiredMark } from "@/components/ui/label";
import { TextField } from "@/components/ui/TextField";
import { getMarketingUtmLinksQueryKey, type GetMarketingUtmLinks200, usePatchMarketingUtmLinksById, usePostMarketingUtmLinks } from "@/lib/api";
import { showToast } from "@/stores";

export type UtmLink = GetMarketingUtmLinks200[number];
const EMPTY = { campaign: "", content: "", medium: "", path: "", source: "", unitSlug: "" };
type Fields = typeof EMPTY;

interface UtmLinkFormProps {
	companyId: string;
	editing: UtmLink | null;
	onDone: () => void;
}

/** Create/edit form of a tracked `/utm/<path>` link. Remounted (via `key`) whenever `editing` changes. */
export function UtmLinkForm({ companyId, editing, onDone }: UtmLinkFormProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [fields, setFields] = useState<Fields>(() => (editing ? { campaign: editing.campaign ?? "", content: editing.content ?? "", medium: editing.medium ?? "", path: editing.path, source: editing.source ?? "", unitSlug: editing.unitSlug ?? "" } : EMPTY));
	const create = usePostMarketingUtmLinks();
	const update = usePatchMarketingUtmLinksById();
	const set = (key: keyof Fields) => (value: string) => setFields(previous => ({ ...previous, [key]: value }));
	const hasUtm = Boolean(fields.source || fields.medium || fields.campaign || fields.content);

	function submit() {
		const body = { ...fields, campaign: fields.campaign || null, content: fields.content || null, medium: fields.medium || null, source: fields.source || null, unitSlug: fields.unitSlug || null };
		const options = {
			onError: (caught: { status?: number }) =>
				showToast(t(caught.status === 409 ? "admin.marketing.utm.pathTaken" : caught.status === 422 ? "admin.marketing.utm.invalid" : "admin.marketing.utm.error"), "negative"),
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: getMarketingUtmLinksQueryKey({ companyId }) });
				showToast(t("admin.marketing.utm.saved"), "positive");
				onDone();
			},
		};
		if (editing) update.mutate({ data: body, id: editing.id }, options);
		else create.mutate({ data: { ...body, companyId } }, options);
	}

	return (
		<form
			className="grid gap-4 rounded-brand border border-border bg-card p-4 sm:grid-cols-2"
			onSubmit={event => {
				event.preventDefault();
				submit();
			}}
		>
			<div className="sm:col-span-2">
				<TextField
					label={<span>{t("admin.marketing.utm.fields.path")} <RequiredMark /></span>}
					name="path"
					onValueChange={set("path")}
					placeholder="influencers/fulano"
					required
					value={fields.path}
				/>
				<p className="mt-1 text-muted-foreground text-xs">{t("admin.marketing.utm.pathHint")}</p>
			</div>
			<TextField label="utm_source" name="utm_source" onValueChange={set("source")} placeholder="ig" value={fields.source} />
			<TextField label="utm_medium" name="utm_medium" onValueChange={set("medium")} placeholder="social" value={fields.medium} />
			<TextField label="utm_campaign" name="utm_campaign" onValueChange={set("campaign")} placeholder="branding_instagram" value={fields.campaign} />
			<TextField label="utm_content" name="utm_content" onValueChange={set("content")} placeholder="link_in_bio" value={fields.content} />
			<div className="sm:col-span-2">
				<TextField
					label={t("admin.marketing.utm.fields.unitSlug")}
					name="unitSlug"
					onValueChange={set("unitSlug")}
					placeholder="centro"
					value={fields.unitSlug}
				/>
				<p className="mt-1 text-muted-foreground text-xs">{t("admin.marketing.utm.unitHint")}</p>
			</div>
			<div className="flex justify-end gap-2 sm:col-span-2">
				<Button onClick={onDone} type="button" variant="outline">{t("admin.marketing.utm.discard")}</Button>
				<Button disabled={create.isPending || update.isPending || !fields.path.trim() || !hasUtm} type="submit">{t("admin.marketing.utm.save")}</Button>
			</div>
		</form>
	);
}
