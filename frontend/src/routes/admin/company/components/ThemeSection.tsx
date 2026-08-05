import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuMoon, LuPalette, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import type { ThemeColors } from "@/lib/theme-colors";
import { PaletteSwatches } from "./PaletteSwatches";
import { ThemePaletteModal } from "./ThemePaletteModal";

interface ThemeSectionProps {
	allowThemeToggle: boolean;
	defaultTheme: keyof ThemeColors;
	onAllowThemeToggleChange: (allowThemeToggle: boolean) => void;
	onDefaultThemeChange: (defaultTheme: keyof ThemeColors) => void;
	onThemeColorsChange: (colors: ThemeColors) => void;
	themeColors: ThemeColors;
}

export function ThemeSection({
	allowThemeToggle,
	defaultTheme,
	onAllowThemeToggleChange,
	onDefaultThemeChange,
	onThemeColorsChange,
	themeColors,
}: ThemeSectionProps) {
	const { t } = useTranslation();
	const [isPaletteOpen, setIsPaletteOpen] = useState(false);

	return (
		<CollapsibleSection
			icon={LuPalette}
			preview={<PaletteSwatches colors={themeColors[defaultTheme]} />}
			summary={t("admin.branding.themeSummary", {
				theme: t(`admin.branding.${defaultTheme}Theme`),
				toggle: t(allowThemeToggle ? "admin.branding.themeToggleOn" : "admin.branding.themeToggleOff"),
			})}
			title={t("admin.branding.sectionTheme")}
		>
			<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-4">
				<Checkbox
					checked={allowThemeToggle}
					onChange={event => onAllowThemeToggleChange(event.currentTarget.checked)}
				/>
				<span className="text-sm">{t("admin.branding.allowThemeToggle")}</span>
			</label>

			<div className="space-y-2 rounded-lg border border-border p-4">
				<p className="font-medium text-sm">{t("admin.branding.defaultTheme")}</p>
				<div className="flex gap-2">
					<Button
						aria-pressed={defaultTheme === "light"}
						onClick={() => onDefaultThemeChange("light")}
						type="button"
						variant={defaultTheme === "light" ? "default" : "outline"}
					>
						<LuSun aria-hidden /> {t("admin.branding.lightTheme")}
					</Button>
					<Button
						aria-pressed={defaultTheme === "dark"}
						onClick={() => onDefaultThemeChange("dark")}
						type="button"
						variant={defaultTheme === "dark" ? "default" : "outline"}
					>
						<LuMoon aria-hidden /> {t("admin.branding.darkTheme")}
					</Button>
				</div>
				<p className="text-muted-foreground text-sm">{t("admin.branding.defaultThemeHint")}</p>
			</div>

			<div className="space-y-3 rounded-lg border border-border p-4">
				<p className="font-medium text-sm">{t("admin.branding.themeColors")}</p>
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
					<span className="flex items-center gap-2 text-muted-foreground text-sm">
						<LuSun aria-hidden className="size-4" /> {t("admin.branding.lightTheme")}
						<PaletteSwatches colors={themeColors.light} />
					</span>
					<span className="flex items-center gap-2 text-muted-foreground text-sm">
						<LuMoon aria-hidden className="size-4" /> {t("admin.branding.darkTheme")}
						<PaletteSwatches colors={themeColors.dark} />
					</span>
				</div>
				<Button onClick={() => setIsPaletteOpen(true)} type="button" variant="outline">
					<LuPalette aria-hidden /> {t("admin.branding.editPalette")}
				</Button>
			</div>

			<ThemePaletteModal
				colors={themeColors}
				isOpen={isPaletteOpen}
				onClose={() => setIsPaletteOpen(false)}
				onSave={onThemeColorsChange}
			/>
		</CollapsibleSection>
	);
}
