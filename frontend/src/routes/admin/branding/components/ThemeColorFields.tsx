import { LuCopy, LuRotateCcw } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/ui/ColorField";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ThemeColorSet, ThemeColors } from "@/lib/theme-colors";

interface ThemeColorFieldsProps {
	colors: ThemeColorSet;
	onChange: (name: keyof ThemeColorSet, value: string) => void;
	onCopy: (name: keyof ThemeColorSet) => void;
	onReset: (name: keyof ThemeColorSet) => void;
	mode: keyof ThemeColors;
}

const groups = [
	{
		name: "surfaces",
		colors: ["background", "foreground", "card", "cardForeground", "popover", "popoverForeground"],
	},
	{
		name: "actions",
		colors: [
			"primary",
			"primaryForeground",
			"secondary",
			"secondaryForeground",
			"accent",
			"accentForeground",
		],
	},
	{ name: "support", colors: ["muted", "mutedForeground", "surfaceSunken"] },
	{ name: "feedback", colors: ["success", "warning", "destructive"] },
	{ name: "boundaries", colors: ["border", "input", "ring"] },
] as const satisfies readonly { colors: readonly (keyof ThemeColorSet)[]; name: string }[];

export function ThemeColorFields({ colors, mode, onChange, onCopy, onReset }: ThemeColorFieldsProps) {
	const { t } = useTranslation();
	const sourceMode = mode === "light" ? "dark" : "light";

	return (
		<div className="space-y-4">
			{groups.map(group => (
				<section className="overflow-hidden rounded-lg border border-border bg-card" key={group.name}>
					<h3 className="border-border border-b bg-muted/50 px-4 py-3 font-semibold text-sm">
						{t(`admin.branding.colorGroups.${group.name}`)}
					</h3>
					<div className="grid gap-x-6 gap-y-6 p-4 lg:grid-cols-3">
						{group.colors.map(name => (
							<div className="min-w-0 space-y-2" key={name}>
								<Label>{t(`admin.branding.colors.${name}`)}</Label>
								<div className="flex items-center gap-4">
									<ColorField onChange={value => onChange(name, value)} value={colors[name]} />
									<Tooltip
										content={t("admin.branding.copyFromTheme", {
											mode: t(`admin.branding.${sourceMode}Theme`),
										})}
									>
										<Button
											aria-label={t("admin.branding.copyColor", {
												color: t(`admin.branding.colors.${name}`),
												mode: t(`admin.branding.${sourceMode}Theme`),
											})}
											onClick={() => onCopy(name)}
											size="icon"
											type="button"
											variant="outline"
										>
											<LuCopy aria-hidden />
										</Button>
									</Tooltip>
									<Tooltip content={t("admin.branding.resetColor")}>
										<Button
											aria-label={t("admin.branding.resetColor", {
												color: t(`admin.branding.colors.${name}`),
											})}
											onClick={() => onReset(name)}
											size="icon"
											type="button"
											variant="outline"
										>
											<LuRotateCcw aria-hidden />
										</Button>
									</Tooltip>
								</div>
							</div>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
