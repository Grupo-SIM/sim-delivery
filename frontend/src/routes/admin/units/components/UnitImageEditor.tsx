import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { Modal } from "@/components/ui/Modal";
import { type GetUnits200, getUnitsQueryKey, usePatchUnitsByUnitId } from "@/lib/api";
import { showAlert } from "@/stores";

interface UnitImageEditorProps {
	onClose: () => void;
	unit: GetUnits200[number] | null;
}

export function UnitImageEditor({ onClose, unit }: UnitImageEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { isPending, mutate } = usePatchUnitsByUnitId();
	const [imageUrl, setImageUrl] = useState("");

	useEffect(() => {
		setImageUrl(unit?.imageUrl ?? "");
	}, [unit]);

	function save() {
		if (!unit) return;

		mutate(
			{ data: { imageUrl: imageUrl.trim() || null }, unitId: unit.id },
			{
				onError: () => void showAlert(t("admin.units.image.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={unit !== null} onClose={onClose} title={t("admin.units.image.title")}>
			<div className="space-y-4">
				<Label>
					{t("admin.units.image.url")}
					<MediaUrlInput
						asset="unit"
						onUploadError={() => void showAlert(t("admin.units.image.uploadError"))}
						onValueChange={setImageUrl}
						uploadLabel={t("admin.units.image.upload")}
						value={imageUrl}
					/>
				</Label>

				{imageUrl && <img alt="" className="h-32 w-full rounded object-cover" src={imageUrl} />}

				<div className="flex justify-end gap-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.units.image.cancel")}
					</Button>
					<Button disabled={isPending} onClick={save} type="button">
						{isPending ? t("admin.units.image.saving") : t("admin.units.image.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
