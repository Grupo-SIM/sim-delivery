import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCopy, LuMoon, LuRotateCcw, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import type { ThemeColorSet, ThemeColors } from "@/lib/theme-colors";
import { ThemeColorFields } from "./ThemeColorFields";

interface ThemeEditorProps {
	colors: ThemeColors;
	onChange: (mode: keyof ThemeColors, name: keyof ThemeColorSet, value: string) => void;
	onCopyAll: (mode: keyof ThemeColors) => void;
	onCopyColor: (mode: keyof ThemeColors, name: keyof ThemeColorSet) => void;
	onResetAll: (mode: keyof ThemeColors) => void;
	onResetColor: (mode: keyof ThemeColors, name: keyof ThemeColorSet) => void;
}

export function ThemeEditor({
	colors,
	onChange,
	onCopyAll,
	onCopyColor,
	onResetAll,
	onResetColor,
}: ThemeEditorProps) {
	const { t } = useTranslation();
	const [mode, setMode] = useState<keyof ThemeColors>("light");
	const sourceMode = mode === "light" ? "dark" : "light";

	return (
		<section className="space-y-4">
			<div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="grid w-full grid-cols-2 gap-2 rounded-md border border-border p-2 lg:w-auto lg:min-w-80">
					<Button
						aria-pressed={mode === "light"}
						className="h-11"
						onClick={() => setMode("light")}
						size="sm"
						type="button"
						variant={mode === "light" ? "default" : "outline"}
					>
						<LuSun aria-hidden /> {t("admin.branding.lightTheme")}
					</Button>
					<Button
						aria-pressed={mode === "dark"}
						className="h-11"
						onClick={() => setMode("dark")}
						size="sm"
						type="button"
						variant={mode === "dark" ? "default" : "outline"}
					>
						<LuMoon aria-hidden /> {t("admin.branding.darkTheme")}
					</Button>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						className="h-11 lg:shrink-0"
						onClick={() => onCopyAll(mode)}
						size="sm"
						type="button"
						variant="outline"
					>
						<LuCopy aria-hidden />
						{t("admin.branding.copyAllColors", { mode: t(`admin.branding.${sourceMode}Theme`) })}
					</Button>
					<Button
						className="h-11 lg:shrink-0"
						onClick={() => onResetAll(mode)}
						size="sm"
						type="button"
						variant="outline"
					>
						<LuRotateCcw aria-hidden />
						{t("admin.branding.resetAllColors")}
					</Button>
				</div>
			</div>

			<ThemeColorFields
				colors={colors[mode]}
				mode={mode}
				onChange={(name, value) => onChange(mode, name, value)}
				onCopy={name => onCopyColor(mode, name)}
				onReset={name => onResetColor(mode, name)}
			/>
		</section>
	);
}
