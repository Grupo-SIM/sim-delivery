import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSave, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { getBrandingTrackingSettingsQueryKey, useGetBrandingTrackingSettings, usePutBranding } from "@/lib/api";
import { showToast } from "@/stores";

export function MetaCapiTokenField() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data, isPending, isError, refetch } = useGetBrandingTrackingSettings();
	const update = usePutBranding();
	const [token, setToken] = useState("");

	function saveToken(value: string) {
		update.mutate({ data: { metaCapiToken: value } }, {
			onError: () => showToast(t("admin.branding.metaCapiTokenError"), "negative"),
			onSuccess: async () => {
				setToken("");
				await queryClient.invalidateQueries({ queryKey: getBrandingTrackingSettingsQueryKey() });
				showToast(t(value ? "admin.branding.metaCapiTokenSaved" : "admin.branding.metaCapiTokenRemoved"), "positive");
			},
		});
	}

	if (isPending) return <Skeleton className="h-36 w-full rounded-md" />;
	if (isError) return <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{t("admin.branding.trackingSettingsLoadError")}</p><Button onClick={() => void refetch()} type="button" variant="outline">{t("admin.branding.trackingSettingsRetry")}</Button></div>;

	return (
		<div className="space-y-3 rounded-md border p-4">
			<p className="text-sm text-muted-foreground" role="status">{t(data.hasMetaCapiToken ? "admin.branding.metaCapiTokenConfigured" : "admin.branding.metaCapiTokenMissing")}</p>
			<TextField autoComplete="new-password" disabled={update.isPending} label={t("admin.branding.metaCapiToken")} maxLength={4096} name="metaCapiToken" onValueChange={setToken} placeholder={t("admin.branding.metaCapiTokenPlaceholder")} type="password" value={token} />
			<p className="text-xs text-muted-foreground">{t("admin.branding.metaCapiTokenHelp")}</p>
			<div className="flex flex-wrap gap-2">
				<Button disabled={update.isPending || !token.trim()} onClick={() => saveToken(token.trim())} type="button"><LuSave className="size-4" />{t("admin.branding.metaCapiTokenSave")}</Button>
				{data.hasMetaCapiToken && <ConfirmActionButton confirmation={t("admin.branding.metaCapiTokenRemoveConfirm")} confirmLabel={t("admin.branding.metaCapiTokenRemoveConfirmLabel")} disabled={update.isPending} idleIcon={<LuTrash2 className="size-4" />} onConfirm={() => saveToken("")} type="button" variant="outline">{t("admin.branding.metaCapiTokenRemove")}</ConfirmActionButton>}
			</div>
		</div>
	);
}
