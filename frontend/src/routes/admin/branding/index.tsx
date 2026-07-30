import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormSectionHeading } from "@/components/ui/FormSectionHeading";
import { Label } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { getBrandingQueryKey, useGetBranding, usePutBranding } from "@/lib/api";
import { defaultThemeColors, resolveThemeColors, type ThemeColors } from "@/lib/theme-colors";
import { slug } from "@/lib/variant";
import { showToast } from "@/stores";
import { FontField, ThemeEditor } from "./components";

const ORDER_STATUS_TEMPLATE_KEYS = ["em_preparo", "saiu_para_entrega", "entregue", "retirado"] as const;
type OrderStatusTemplateKey = (typeof ORDER_STATUS_TEMPLATE_KEYS)[number];
type OrderStatusTemplates = Record<OrderStatusTemplateKey, string>;

const defaultOrderStatusTemplates: OrderStatusTemplates = {
	em_preparo: "Seu pedido {{orderId}} está em preparo.",
	entregue: "Seu pedido {{orderId}} foi entregue. Bom apetite!",
	retirado: "Seu pedido {{orderId}} está pronto para retirada.",
	saiu_para_entrega: "Seu pedido {{orderId}} saiu para entrega.",
};

function BrandingPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: branding, isError, isPending } = useGetBranding(slug ? { slug } : undefined);
	const put = usePutBranding();

	const [logoUrl, setLogoUrl] = useState("");
	const [unitFallbackImageUrl, setUnitFallbackImageUrl] = useState("");
	const [allowThemeToggle, setAllowThemeToggle] = useState(true);
	const [fontFamily, setFontFamily] = useState("");
	const [fontFamilyUrl, setFontFamilyUrl] = useState("");
	const [fontDisplay, setFontDisplay] = useState("");
	const [fontDisplayUrl, setFontDisplayUrl] = useState("");
	const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors);
	const [footerText, setFooterText] = useState("");
	const [footerPaymentMethods, setFooterPaymentMethods] = useState("");
	const [footerInstagramUrl, setFooterInstagramUrl] = useState("");
	const [footerFacebookUrl, setFooterFacebookUrl] = useState("");
	const [footerWhatsApp, setFooterWhatsApp] = useState("");
	const [footerSupportEmail, setFooterSupportEmail] = useState("");
	const [metaPixelId, setMetaPixelId] = useState("");
	const [ga4Id, setGa4Id] = useState("");
	const [gtmId, setGtmId] = useState("");
	const [orderStatusTemplates, setOrderStatusTemplates] =
		useState<OrderStatusTemplates>(defaultOrderStatusTemplates);

	useEffect(() => {
		if (branding) {
			setAllowThemeToggle(branding.allowThemeToggle);
			setLogoUrl(branding.logoUrl ?? "");
			setUnitFallbackImageUrl(branding.unitFallbackImageUrl ?? "");
			setFontFamily(branding.fontFamily ?? "");
			setFontFamilyUrl(branding.fontFamilyUrl ?? "");
			setFontDisplay(branding.fontDisplay ?? "");
			setFontDisplayUrl(branding.fontDisplayUrl ?? "");
			setThemeColors(resolveThemeColors(branding.themeColors));
			setFooterText(branding.footerText ?? "");
			setFooterPaymentMethods(branding.footerPaymentMethods.join(", "));
			setFooterInstagramUrl(branding.footerInstagramUrl ?? "");
			setFooterFacebookUrl(branding.footerFacebookUrl ?? "");
			setFooterWhatsApp(branding.footerWhatsApp ?? "");
			setFooterSupportEmail(branding.footerSupportEmail ?? "");
			setMetaPixelId(branding.metaPixelId ?? "");
			setGa4Id(branding.ga4Id ?? "");
			setGtmId(branding.gtmId ?? "");
			setOrderStatusTemplates({ ...defaultOrderStatusTemplates, ...branding.orderStatusWhatsAppTemplates });
		}
	}, [branding]);

	function setThemeColor(mode: keyof ThemeColors, name: keyof ThemeColors["light"], value: string) {
		setThemeColors(current => ({ ...current, [mode]: { ...current[mode], [name]: value } }));
	}

	function copyThemeColor(mode: keyof ThemeColors, name: keyof ThemeColors["light"]) {
		const sourceMode = mode === "light" ? "dark" : "light";
		setThemeColor(mode, name, themeColors[sourceMode][name]);
		showToast(t("admin.branding.colorCopied", { mode: t(`admin.branding.${sourceMode}Theme`) }), "info");
	}

	function resetThemeColor(mode: keyof ThemeColors, name: keyof ThemeColors["light"]) {
		setThemeColor(mode, name, defaultThemeColors[mode][name]);
		showToast(t("admin.branding.colorReset"), "info");
	}

	function copyAllThemeColors(mode: keyof ThemeColors) {
		const sourceMode = mode === "light" ? "dark" : "light";
		setThemeColors(current => ({ ...current, [mode]: current[sourceMode] }));
		showToast(t("admin.branding.allColorsCopied", { mode: t(`admin.branding.${sourceMode}Theme`) }), "info");
	}

	function resetAllThemeColors(mode: keyof ThemeColors) {
		setThemeColors(current => ({ ...current, [mode]: { ...defaultThemeColors[mode] } }));
		showToast(t("admin.branding.allColorsReset"), "info");
	}

	function setOrderStatusTemplate(status: OrderStatusTemplateKey, value: string) {
		setOrderStatusTemplates(current => ({ ...current, [status]: value }));
	}

	function save() {
		put.mutate(
			{
				data: {
					allowThemeToggle,
					fontDisplay: fontDisplay.trim() || undefined,
					fontDisplayUrl: fontDisplayUrl.trim() || undefined,
					fontFamily: fontFamily.trim() || undefined,
					fontFamilyUrl: fontFamilyUrl.trim() || undefined,
					footerFacebookUrl: footerFacebookUrl.trim() || undefined,
					footerInstagramUrl: footerInstagramUrl.trim() || undefined,
					footerPaymentMethods: footerPaymentMethods
						.split(",")
						.map(method => method.trim())
						.filter(Boolean),
					footerSupportEmail: footerSupportEmail.trim() || undefined,
					footerText: footerText.trim() || undefined,
					footerWhatsApp: footerWhatsApp.trim() || undefined,
					ga4Id: ga4Id.trim() || undefined,
					gtmId: gtmId.trim() || undefined,
					logoUrl: logoUrl.trim() || undefined,
					metaPixelId: metaPixelId.trim() || undefined,
					orderStatusWhatsAppTemplates: Object.fromEntries(
						ORDER_STATUS_TEMPLATE_KEYS.flatMap(status => {
							const template = orderStatusTemplates[status].trim();
							return template ? [[status, template]] : [];
						}),
					),
					themeColors,
					unitFallbackImageUrl: unitFallbackImageUrl.trim() || undefined,
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
		<Container className="max-w-5xl space-y-6 py-8">
			<SectionHeading subtitle={t("admin.branding.subtitle")} title={t("admin.branding.title")} />
			{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label. */}
			<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-4">
				<Checkbox
					checked={allowThemeToggle}
					onChange={event => setAllowThemeToggle(event.currentTarget.checked)}
				/>
				<span>Permitir troca entre tema claro e escuro pelo botão flutuante</span>
			</label>

			{isPending ? (
				<div className="space-y-4">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("admin.branding.loadError")} />
			) : (
				<div className="space-y-6">
					<div className="space-y-4">
						<FormSectionHeading>{t("admin.branding.sectionAppearance")}</FormSectionHeading>

						<TextField
							label={t("admin.branding.footerText")}
							onValueChange={setFooterText}
							placeholder={t("admin.branding.footerTextPlaceholder")}
							value={footerText}
						/>
						<FormSectionHeading>{t("admin.branding.sectionFooter")}</FormSectionHeading>
						<TextField
							label={t("admin.branding.footerPaymentMethods")}
							onValueChange={setFooterPaymentMethods}
							placeholder={t("admin.branding.footerPaymentMethodsPlaceholder")}
							value={footerPaymentMethods}
						/>
						<TextField
							label={t("admin.branding.footerWhatsApp")}
							onValueChange={setFooterWhatsApp}
							placeholder={t("admin.branding.footerWhatsAppPlaceholder")}
							value={footerWhatsApp}
						/>
						<TextField
							label={t("admin.branding.footerSupportEmail")}
							onValueChange={setFooterSupportEmail}
							placeholder="contato@minhaloja.com"
							value={footerSupportEmail}
						/>
						<TextField
							label={t("admin.branding.footerInstagramUrl")}
							onValueChange={setFooterInstagramUrl}
							placeholder="https://instagram.com/minhaloja"
							value={footerInstagramUrl}
						/>
						<TextField
							label={t("admin.branding.footerFacebookUrl")}
							onValueChange={setFooterFacebookUrl}
							placeholder="https://facebook.com/minhaloja"
							value={footerFacebookUrl}
						/>
						<Label>
							{t("admin.branding.logoUrl")}
							<MediaUrlInput
								asset="logo"
								onUploadError={() => showToast(t("admin.branding.uploadError"), "negative")}
								onValueChange={setLogoUrl}
								uploadLabel={t("admin.branding.logoUpload")}
								value={logoUrl}
							/>
						</Label>

						<Label>
							{t("admin.branding.unitFallbackImageUrl")}
							<MediaUrlInput
								asset="unit"
								onUploadError={() => showToast(t("admin.branding.uploadError"), "negative")}
								onValueChange={setUnitFallbackImageUrl}
								uploadLabel={t("admin.branding.unitFallbackImageUpload")}
								value={unitFallbackImageUrl}
							/>
						</Label>

						<FontField
							family={fontFamily}
							label={t("admin.branding.fontFamily")}
							onUploadError={() => showToast(t("admin.branding.uploadError"), "negative")}
							onUrlChange={url => {
								setFontFamilyUrl(url);
								if (url) setFontFamily("Brand Text");
							}}
							previewLabel={t("admin.branding.fontFamilyPreview")}
							sampleClassName="text-lg"
							sampleText="Aa Bb Cc 123"
							uploadAsset="font-family"
							url={fontFamilyUrl}
						/>

						<FontField
							family={fontDisplay}
							label={t("admin.branding.fontDisplay")}
							onUploadError={() => showToast(t("admin.branding.uploadError"), "negative")}
							onUrlChange={url => {
								setFontDisplayUrl(url);
								if (url) setFontDisplay("Brand Display");
							}}
							previewLabel={t("admin.branding.fontDisplayPreview")}
							sampleClassName="text-2xl"
							sampleText="Aa Bb Cc 123"
							uploadAsset="font-display"
							url={fontDisplayUrl}
						/>

						<FormSectionHeading>{t("admin.branding.themeColors")}</FormSectionHeading>
						<ThemeEditor
							colors={themeColors}
							onChange={setThemeColor}
							onCopyAll={copyAllThemeColors}
							onCopyColor={copyThemeColor}
							onResetAll={resetAllThemeColors}
							onResetColor={resetThemeColor}
						/>
					</div>

					<div className="space-y-4">
						<FormSectionHeading>{t("admin.branding.sectionNotifications")}</FormSectionHeading>
						<p className="text-muted-foreground text-sm">{t("admin.branding.notificationsHelp")}</p>
						{ORDER_STATUS_TEMPLATE_KEYS.map(status => (
							<TextField
								key={status}
								label={t(`admin.branding.orderStatus.${status}`)}
								onValueChange={value => setOrderStatusTemplate(status, value)}
								placeholder={t("admin.branding.notificationPlaceholder")}
								value={orderStatusTemplates[status]}
							/>
						))}
					</div>

					<div className="space-y-4">
						<FormSectionHeading>{t("admin.branding.sectionTracking")}</FormSectionHeading>
						<TextField
							label={t("admin.branding.metaPixelId")}
							onValueChange={setMetaPixelId}
							placeholder="1234567890"
							value={metaPixelId}
						/>
						<TextField
							label={t("admin.branding.ga4Id")}
							onValueChange={setGa4Id}
							placeholder="G-XXXXXXXXXX"
							value={ga4Id}
						/>
						<TextField
							label={t("admin.branding.gtmId")}
							onValueChange={setGtmId}
							placeholder="GTM-XXXXXXX"
							value={gtmId}
						/>
					</div>

					<Button disabled={put.isPending} onClick={save} type="button">
						{put.isPending ? t("admin.branding.saving") : t("admin.branding.save")}
					</Button>
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/branding/")({
	component: BrandingPage,
});
