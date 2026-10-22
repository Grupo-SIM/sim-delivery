import { defaultThemeColors, type ThemeColors, resolveThemeColors } from "@/lib/theme-colors";

/** Light palette extracted from Estação 237; dark palette is a suggested adaptation. */
export const referenceThemeColors: ThemeColors = {
	light: {
		...defaultThemeColors.light,
		primary: "#8E1B2E", primaryForeground: "#FFFFFF", secondary: "#6E1424", secondaryForeground: "#FFFFFF",
		accent: "#E3A41A", accentForeground: "#1F1513", background: "#FBF6EE", foreground: "#1F1513",
		cardForeground: "#1F1513", popoverForeground: "#1F1513", muted: "#F1E6D6", mutedForeground: "#5F504A",
		border: "#EADFCF", input: "#EADFCF", ring: "#8E1B2E", destructive: "#B3261E", success: "#1F8F4E",
		warning: "#E3A41A", surfaceSunken: "#F1E6D6",
	},
	dark: {
		...defaultThemeColors.dark,
		primary: "#E3A41A", primaryForeground: "#1F1513", secondary: "#6E1424", secondaryForeground: "#FFFFFF",
		accent: "#E3A41A", accentForeground: "#1F1513", background: "#1F1513", foreground: "#FBF6EE",
		card: "#30221F", cardForeground: "#FBF6EE", popover: "#30221F", popoverForeground: "#FBF6EE",
		muted: "#3F302B", mutedForeground: "#D6C6BB", border: "#5F504A", input: "#5F504A", ring: "#E3A41A",
		destructive: "#FF8A80", success: "#73D699", warning: "#E3A41A", surfaceSunken: "#160F0D",
	},
};

export const colorLabels: Record<keyof ThemeColors["light"], string> = {
	accent: "Destaque", accentForeground: "Texto de destaque", background: "Fundo", border: "Bordas",
	card: "Cartões", cardForeground: "Texto dos cartões", destructive: "Erro / exclusão", foreground: "Texto",
	input: "Borda dos campos", muted: "Fundo suave", mutedForeground: "Texto secundário", popover: "Popovers",
	popoverForeground: "Texto dos popovers", primary: "Principal", primaryForeground: "Texto principal",
	ring: "Foco", secondary: "Secundária", secondaryForeground: "Texto secundário da marca",
	success: "Sucesso", surfaceSunken: "Fundo rebaixado", warning: "Avisos",
};

export function validatePalette(value: unknown): ThemeColors {
	if (!value || typeof value !== "object") throw new Error("Invalid palette");
	const result = structuredClone(defaultThemeColors);
	for (const mode of ["light", "dark"] as const) {
		const colors = (value as Record<string, unknown>)[mode];
		if (!colors || typeof colors !== "object") throw new Error("Missing theme");
		for (const key of Object.keys(result[mode]) as (keyof ThemeColors["light"])[]) {
			const color = (colors as Record<string, unknown>)[key];
			if (typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color)) throw new Error("Invalid color");
			result[mode][key] = color;
		}
	}
	return result;
}

export function companyPalette(value: unknown) {
	if (!value) return structuredClone(defaultThemeColors);
	return resolveThemeColors(validatePalette(value));
}
