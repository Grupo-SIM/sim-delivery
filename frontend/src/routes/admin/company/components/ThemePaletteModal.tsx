import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { getBrandingQueryKey, usePutBranding } from "@/lib/api";
import { slug } from "@/lib/variant";
import { defaultThemeColors, type ThemeColorSet, type ThemeColors } from "@/lib/theme-colors";
import { showToast } from "@/stores";
import { ThemeEditor } from "./ThemeEditor";

interface ThemePaletteModalProps {
	colors: ThemeColors;
	isOpen: boolean;
	onClose: () => void;
	onSave: (colors: ThemeColors) => void;
}

/** Full palette editor. Edits a draft copy, so discarding leaves the page state untouched. */
export function ThemePaletteModal({ colors, isOpen, onClose, onSave }: ThemePaletteModalProps) {
	const { t } = useTranslation();
	const [draft, setDraft] = useState(colors);
	const queryClient = useQueryClient();
	const put = usePutBranding();

	useEffect(() => {
		if (isOpen) setDraft(colors);
	}, [isOpen, colors]);

	function setColor(mode: keyof ThemeColors, name: keyof ThemeColorSet, value: string) {
		setDraft(current => ({ ...current, [mode]: { ...current[mode], [name]: value } }));
	}

	function copyColor(mode: keyof ThemeColors, name: keyof ThemeColorSet) {
		const sourceMode = mode === "light" ? "dark" : "light";
		setDraft(current => ({ ...current, [mode]: { ...current[mode], [name]: current[sourceMode][name] } }));
		showToast(t("admin.branding.colorCopied", { mode: t(`admin.branding.${sourceMode}Theme`) }), "info");
	}

	function resetColor(mode: keyof ThemeColors, name: keyof ThemeColorSet) {
		setColor(mode, name, defaultThemeColors[mode][name]);
		showToast(t("admin.branding.colorReset"), "info");
	}

	function copyAllColors(mode: keyof ThemeColors) {
		const sourceMode = mode === "light" ? "dark" : "light";
		setDraft(current => ({ ...current, [mode]: { ...current[sourceMode] } }));
		showToast(t("admin.branding.allColorsCopied", { mode: t(`admin.branding.${sourceMode}Theme`) }), "info");
	}

	function resetAllColors(mode: keyof ThemeColors) {
		setDraft(current => ({ ...current, [mode]: { ...defaultThemeColors[mode] } }));
		showToast(t("admin.branding.allColorsReset"), "info");
	}

	function save() {
		put.mutate(
			{ data: { themeColors: draft } },
			{
				onError: () => showToast(t("admin.branding.saveError"), "negative"),
				onSuccess: () => {
					onSave(draft);
					// Keep other unsaved company fields intact; refresh branding on the next fetch.
					queryClient.invalidateQueries({
						queryKey: getBrandingQueryKey(slug ? { slug } : undefined),
						refetchType: "none",
					});
					showToast(t("admin.branding.paletteApplied"), "positive");
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="960px"
			onClose={() => { if (!put.isPending) onClose(); }}
			title={t("admin.branding.themeColors")}
			urlKey="theme-palette"
		>
			<div className="space-y-4">
				<p className="text-muted-foreground text-sm">{t("admin.branding.paletteHint")}</p>

				<ThemeEditor
					colors={draft}
					onChange={setColor}
					onCopyAll={copyAllColors}
					onCopyColor={copyColor}
					onResetAll={resetAllColors}
					onResetColor={resetColor}
				/>

				<div className="flex justify-end gap-2 border-border border-t pt-4">
					<Button disabled={put.isPending} onClick={onClose} type="button" variant="outline">
						{t("actions.discard")}
					</Button>
					<Button disabled={put.isPending} onClick={save} type="button">
						{put.isPending ? t("admin.branding.saving") : t("actions.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
