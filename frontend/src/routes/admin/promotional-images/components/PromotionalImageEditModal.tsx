import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	type GetPromotionalImages200,
	getPromotionalImagesQueryKey,
	usePatchPromotionalImagesByPromotionalImageId,
} from "@/lib/api";
import { showToast } from "@/stores";

type PromotionalImage = GetPromotionalImages200[number];

interface PromotionalImageEditModalProps {
	image: PromotionalImage | null;
	onClose: () => void;
}

export function PromotionalImageEditModal({ image, onClose }: PromotionalImageEditModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const update = usePatchPromotionalImagesByPromotionalImageId();
	const [title, setTitle] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [localTitle, setLocalTitle] = useDebouncedInput(title, setTitle);
	const [localLink, setLocalLink] = useDebouncedInput(linkUrl, setLinkUrl);

	useEffect(() => {
		setTitle(image?.title ?? "");
		setImageUrl(image?.imageUrl ?? "");
		setLinkUrl(image?.linkUrl ?? "");
	}, [image]);

	function submit() {
		if (!image) return;
		update.mutate(
			{ data: { imageUrl, linkUrl: linkUrl.trim() || null, title }, promotionalImageId: image.id },
			{
				onError: () => showToast(t("admin.promotionalImages.edit.error"), "negative"),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getPromotionalImagesQueryKey() });
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={image !== null}
			onClose={onClose}
			title={t("admin.promotionalImages.edit.title")}
			urlKey="promotional-image-edit"
			urlState={image?.id}
		>
			<div className="space-y-4">
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
				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("actions.cancel")}
					</Button>
					<Button
						disabled={!title.trim() || !imageUrl.trim() || update.isPending}
						onClick={submit}
						type="button"
					>
						{t("actions.confirm")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
