import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getPromotionalImagesQueryKey, usePostPromotionalImages } from "@/lib/api";
import { showToast } from "@/stores";

export function PromotionalImageForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const create = usePostPromotionalImages();
	const [title, setTitle] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [localTitle, setLocalTitle] = useDebouncedInput(title, setTitle);
	const [localLink, setLocalLink] = useDebouncedInput(linkUrl, setLinkUrl);
	const hasData = Boolean(title || imageUrl || linkUrl);

	function submit() {
		create.mutate(
			{ data: { imageUrl, linkUrl: linkUrl.trim() || null, title } },
			{
				onError: () => showToast(t("admin.promotionalImages.create.error"), "negative"),
				onSuccess: async () => {
					setTitle("");
					setImageUrl("");
					setLinkUrl("");
					await queryClient.invalidateQueries({ queryKey: getPromotionalImagesQueryKey() });
				},
			},
		);
	}

	return (
		<form
			className="group space-y-4 rounded-lg border border-border bg-card p-4"
			onSubmit={event => {
				event.preventDefault();
				submit();
			}}
		>
			<Label>
				<span>
					{t("admin.promotionalImages.fields.title")} <RequiredMark />
				</span>
				<Input
					onChange={event => setLocalTitle(event.currentTarget.value)}
					placeholder={t("admin.promotionalImages.fields.titlePlaceholder")}
					value={localTitle}
				/>
			</Label>
			<CollapsibleFormSection expanded={hasData}>
				<div className="grid gap-4 md:grid-cols-2">
					<Label>
						<span>
							{t("admin.promotionalImages.fields.image")} <RequiredMark />
						</span>
						<MediaUrlInput
							asset="promotion"
							onUploadError={() => showToast(t("admin.promotionalImages.uploadError"), "negative")}
							onValueChange={setImageUrl}
							uploadLabel={t("admin.promotionalImages.upload")}
							value={imageUrl}
						/>
					</Label>
					<Label>
						{t("admin.promotionalImages.fields.link")}
						<Input
							onChange={event => setLocalLink(event.currentTarget.value)}
							placeholder="https://exemplo.com/oferta"
							value={localLink}
						/>
					</Label>
				</div>
			</CollapsibleFormSection>
			<div className="flex justify-end">
				<Button disabled={!title.trim() || !imageUrl.trim() || create.isPending} type="submit">
					{create.isPending
						? t("admin.promotionalImages.create.saving")
						: t("admin.promotionalImages.create.submit")}
				</Button>
			</div>
		</form>
	);
}
