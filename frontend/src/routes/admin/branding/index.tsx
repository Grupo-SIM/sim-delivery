import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getBrandingQueryKey, useGetBranding, usePutBranding } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";
import { showAlert } from "@/stores";

function BrandingPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: branding, isError, isPending } = useGetBranding();
	const put = usePutBranding();

	const [logoUrl, setLogoUrl] = useState("");
	const [primaryColor, setPrimaryColor] = useState("");
	const [footerText, setFooterText] = useState("");

	useEffect(() => {
		if (branding) {
			setLogoUrl(branding.logoUrl ?? "");
			setPrimaryColor(branding.primaryColor ?? "");
			setFooterText(branding.footerText ?? "");
		}
	}, [branding]);

	function save() {
		put.mutate(
			{
				data: {
					footerText: footerText.trim() || undefined,
					logoUrl: logoUrl.trim() || undefined,
					primaryColor: primaryColor.trim() || undefined,
				},
			},
			{
				onError: () => void showAlert(t("admin.branding.saveError")),
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: getBrandingQueryKey() });
					void showAlert(t("admin.branding.saveSuccess"));
				},
			},
		);
	}

	return (
		<Container className="max-w-lg space-y-6 py-8">
			<SectionHeading subtitle={t("admin.branding.subtitle")} title={t("admin.branding.title")} />

			{isPending ? (
				<div className="space-y-4">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("admin.branding.loadError")} />
			) : (
				<div className="space-y-4">
					<TextField
						label={t("admin.branding.logoUrl")}
						onValueChange={setLogoUrl}
						placeholder={t("admin.branding.logoUrlPlaceholder")}
						value={logoUrl}
					/>
					<TextField
						label={t("admin.branding.primaryColor")}
						onValueChange={setPrimaryColor}
						placeholder={t("admin.branding.colorHint")}
						value={primaryColor}
					/>
					<TextField
						label={t("admin.branding.footerText")}
						onValueChange={setFooterText}
						placeholder={t("admin.branding.footerTextPlaceholder")}
						value={footerText}
					/>

					{logoUrl && (
						<div className="rounded border border-border p-3 text-sm text-muted-foreground">
							<p className="mb-2 text-xs font-medium uppercase">{t("admin.branding.logoUrl")}</p>
							<img alt="logo preview" className="h-12 object-contain" src={logoUrl} />
						</div>
					)}

					<Button disabled={put.isPending} onClick={save} type="button">
						{put.isPending ? t("admin.branding.saving") : t("admin.branding.save")}
					</Button>
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/branding/")({
	beforeLoad: requireStaffBeforeLoad,
	component: BrandingPage,
});
