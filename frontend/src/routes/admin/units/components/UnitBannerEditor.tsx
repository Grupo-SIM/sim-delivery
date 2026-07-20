import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { Modal } from "@/components/ui/Modal";
import { type GetUnits200, getUnitsQueryKey, usePatchUnitsByUnitId } from "@/lib/api";
import { showAlert } from "@/stores";

interface UnitBannerEditorProps {
	onClose: () => void;
	unit: GetUnits200[number] | null;
}

export function UnitBannerEditor({ onClose, unit }: UnitBannerEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { isPending, mutate } = usePatchUnitsByUnitId();
	const [bannerUrl, setBannerUrl] = useState("");

	useEffect(() => {
		setBannerUrl(unit?.bannerUrl ?? "");
	}, [unit]);

	function save() {
		if (!unit) return;

		mutate(
			{ data: { bannerUrl: bannerUrl.trim() || null }, unitId: unit.id },
			{
				onError: () => void showAlert(t("admin.units.banner.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={unit !== null} onClose={onClose} title={t("admin.units.banner.title")}>
			<div className="space-y-4">
				<Label>
					{t("admin.units.banner.url")}
					<MediaUrlInput
						asset="banner"
						onUploadError={() => void showAlert(t("admin.units.banner.uploadError"))}
						onValueChange={setBannerUrl}
						uploadLabel={t("admin.units.banner.upload")}
						value={bannerUrl}
					/>
				</Label>

				{bannerUrl && <img alt="" className="h-32 w-full rounded object-cover" src={bannerUrl} />}

				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.units.banner.cancel")}
					</Button>
					<Button disabled={isPending} onClick={save} type="button">
						{isPending ? t("admin.units.banner.saving") : t("admin.units.banner.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
