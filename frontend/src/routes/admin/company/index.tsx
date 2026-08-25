import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { getBrandingQueryKey, useGetBranding, usePutBranding } from "@/lib/api";
import { defaultThemeColors, resolveThemeColors, type ThemeColors } from "@/lib/theme-colors";
import { slug } from "@/lib/variant";
import { showToast } from "@/stores";
import {
	BrandAssetsSection,
	type BrandAssetsState,
	defaultOrderStatusTemplates,
	emptyBrandAssets,
	emptyFonts,
	emptyFooter,
	emptyTracking,
	type FontsState,
	FooterSection,
	type FooterState,
	NotificationTemplatesSection,
	ORDER_STATUS_TEMPLATE_KEYS,
	type OrderStatusTemplates,
	ThemeSection,
	TrackingSection,
	type TrackingState,
	TypographySection,
} from "./components";

/** One skeleton per collapsed section card, so the loading state mirrors the settled layout. */
const sectionSkeletonKeys = ["theme", "assets", "typography", "footer", "notifications", "tracking"] as const;

function BrandingPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: branding, isError, isPending } = useGetBranding(slug ? { slug } : undefined);
	const put = usePutBranding();

	const [allowThemeToggle, setAllowThemeToggle] = useState(true);
	const [defaultTheme, setDefaultTheme] = useState<keyof ThemeColors>("light");
	const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors);
	const [assets, setAssets] = useState<BrandAssetsState>(emptyBrandAssets);
	const [fonts, setFonts] = useState<FontsState>(emptyFonts);
	const [footer, setFooter] = useState<FooterState>(emptyFooter);
	const [tracking, setTracking] = useState<TrackingState>(emptyTracking);
	const [orderStatusTemplates, setOrderStatusTemplates] =
		useState<OrderStatusTemplates>(defaultOrderStatusTemplates);

	useEffect(() => {
		if (branding) {
			setAllowThemeToggle(branding.allowThemeToggle);
			setDefaultTheme(branding.defaultTheme);
			setThemeColors(resolveThemeColors(branding.themeColors));
			setAssets({
				homepageBannerUrls: branding.homepageBannerUrls.length ? branding.homepageBannerUrls : [""],
				logoUrl: branding.logoUrl ?? "",
				mobileIconUrl: branding.mobileIconUrl ?? "",
				unitFallbackImageUrl: branding.unitFallbackImageUrl ?? "",
			});
			setFonts({
				display: branding.fontDisplay ?? "",
				displayUrl: branding.fontDisplayUrl ?? "",
				family: branding.fontFamily ?? "",
				familyUrl: branding.fontFamilyUrl ?? "",
			});
			setFooter({
				facebookUrl: branding.footerFacebookUrl ?? "",
				instagramUrl: branding.footerInstagramUrl ?? "",
				paymentMethods: branding.footerPaymentMethods.join(", "),
				supportEmail: branding.footerSupportEmail ?? "",
				text: branding.footerText ?? "",
				whatsApp: branding.footerWhatsApp ?? "",
			});
			setTracking({
				ga4Id: branding.ga4Id ?? "",
				gtmId: branding.gtmId ?? "",
				metaPixelId: branding.metaPixelId ?? "",
			});
			setOrderStatusTemplates({ ...defaultOrderStatusTemplates, ...branding.orderStatusWhatsAppTemplates });
		}
	}, [branding]);

	function save() {
		put.mutate(
			{
				data: {
					allowThemeToggle,
					defaultTheme,
					fontDisplay: fonts.display.trim() || undefined,
					fontDisplayUrl: fonts.displayUrl.trim() || undefined,
					fontFamily: fonts.family.trim() || undefined,
					fontFamilyUrl: fonts.familyUrl.trim() || undefined,
					footerFacebookUrl: footer.facebookUrl.trim() || undefined,
					footerInstagramUrl: footer.instagramUrl.trim() || undefined,
					footerPaymentMethods: footer.paymentMethods
						.split(",")
						.map(method => method.trim())
						.filter(Boolean),
					footerSupportEmail: footer.supportEmail.trim() || undefined,
					footerText: footer.text.trim() || undefined,
					footerWhatsApp: footer.whatsApp.trim() || undefined,
					ga4Id: tracking.ga4Id.trim() || undefined,
					gtmId: tracking.gtmId.trim() || undefined,
					homepageBannerUrls: assets.homepageBannerUrls
						.map(homepageBannerUrl => homepageBannerUrl.trim())
						.filter(Boolean),
					logoUrl: assets.logoUrl.trim() || undefined,
					metaPixelId: tracking.metaPixelId.trim() || undefined,
					mobileIconUrl: assets.mobileIconUrl.trim() || undefined,
					orderStatusWhatsAppTemplates: Object.fromEntries(
						ORDER_STATUS_TEMPLATE_KEYS.flatMap(status => {
							const template = orderStatusTemplates[status].trim();
							return template ? [[status, template]] : [];
						}),
					),
					themeColors,
					unitFallbackImageUrl: assets.unitFallbackImageUrl.trim() || undefined,
				},
			},
			{
				onError: () => showToast(t("admin.branding.saveError"), "negative"),
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: getBrandingQueryKey(slug ? { slug } : undefined) });
					showToast(t("admin.branding.saveSuccess"), "positive");
				},
			},
		);
	}

	return (
		<Container className="space-y-6 py-8" size="md">
			<SectionHeading subtitle={t("admin.branding.subtitle")} title={t("admin.branding.title")} />

			{isPending ? (
				<div className="space-y-3">
					{sectionSkeletonKeys.map(key => (
						<Skeleton className="h-20 w-full rounded-lg" key={key} />
					))}
				</div>
			) : isError ? (
				<ErrorState title={t("admin.branding.loadError")} />
			) : (
				<div className="space-y-3">
					<ThemeSection
						allowThemeToggle={allowThemeToggle}
						defaultTheme={defaultTheme}
						onAllowThemeToggleChange={setAllowThemeToggle}
						onDefaultThemeChange={setDefaultTheme}
						onThemeColorsChange={setThemeColors}
						themeColors={themeColors}
					/>

					<BrandAssetsSection
						assets={assets}
						onChange={changes => setAssets(current => ({ ...current, ...changes }))}
					/>

					<TypographySection
						fonts={fonts}
						onChange={changes => setFonts(current => ({ ...current, ...changes }))}
					/>

					<FooterSection
						footer={footer}
						onChange={changes => setFooter(current => ({ ...current, ...changes }))}
					/>

					<NotificationTemplatesSection
						onChange={changes => setOrderStatusTemplates(current => ({ ...current, ...changes }))}
						templates={orderStatusTemplates}
					/>

					<TrackingSection
						onChange={changes => setTracking(current => ({ ...current, ...changes }))}
						tracking={tracking}
					/>

					<Button className="ml-auto flex w-fit" disabled={put.isPending} onClick={save} type="button">
						{put.isPending ? t("admin.branding.saving") : t("admin.branding.save")}
					</Button>
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/company/")({
	component: BrandingPage,
});
