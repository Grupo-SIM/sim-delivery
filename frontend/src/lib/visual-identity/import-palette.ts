import type { ThemeColors } from "@/lib/theme-colors";
import { colorLabels, validatePalette } from "./palette";

/** Parse as inert XML; never attach uploaded SVG to the page or render its scripts. */
export function importPaletteSvg(source: string): ThemeColors {
	if (source.length > 2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error("Invalid SVG");
	const document = new DOMParser().parseFromString(source, "image/svg+xml");
	const root = document.documentElement;
	if (document.querySelector("parsererror") || root.localName !== "svg" || root.getAttribute("data-sim-delivery-palette") !== "1") {
		throw new Error("Unsupported template");
	}
	const palette: Record<string, Record<string, string>> = { dark: {}, light: {} };
	for (const mode of ["light", "dark"] as const) {
		for (const token of Object.keys(colorLabels)) {
			const nodes = root.querySelectorAll(`rect[data-theme="${mode}"][data-token="${token}"]`);
			if (nodes.length !== 1) throw new Error("Missing or duplicate color");
			palette[mode][token] = nodes[0].getAttribute("fill") ?? "";
		}
	}
	return validatePalette(palette);
}
