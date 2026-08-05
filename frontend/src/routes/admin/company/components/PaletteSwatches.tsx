import type { ThemeColorSet } from "@/lib/theme-colors";
import { cn } from "@/lib/utils";

/** Colors that best summarize a palette at a glance. */
const previewColors = ["background", "foreground", "primary", "secondary", "accent"] as const;

interface PaletteSwatchesProps {
	className?: string;
	colors: ThemeColorSet;
}

export function PaletteSwatches({ className, colors }: PaletteSwatchesProps) {
	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			{previewColors.map(name => (
				<span
					className="size-4 rounded-full border border-border"
					key={name}
					style={{ backgroundColor: colors[name] }}
				/>
			))}
		</span>
	);
}
