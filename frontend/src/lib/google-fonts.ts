const WEIGHTS = "400;500;600;700;800;900";

function toFamilyParam(family: string) {
	return `family=${encodeURIComponent(family.trim()).replace(/%20/g, "+")}:wght@${WEIGHTS}`;
}

export function googleFontsUrl(families: string[]) {
	const params = families.filter(family => family.trim()).map(toFamilyParam);
	return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

function googleFontLinkId(family: string) {
	return `google-font-${family
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")}`;
}

/** Injects (once per family) a Google Fonts stylesheet link so the family becomes usable via font-family. */
export function loadGoogleFont(family: string | null | undefined) {
	if (typeof document === "undefined" || !family?.trim()) return;
	if (["arial", "times new roman"].includes(family.trim().toLowerCase())) return;

	const id = googleFontLinkId(family);
	if (document.getElementById(id)) return;

	const link = document.createElement("link");
	link.id = id;
	link.rel = "stylesheet";
	link.href = googleFontsUrl([family]);
	document.head.appendChild(link);
}

function escapeCssValue(value: string) {
	return value.replace(/["\\\\]/g, "\\\\$&");
}

export function fontsToCss(
	fontFamily: string,
	fontDisplay: string,
	fontFamilyUrl?: string | null,
	fontDisplayUrl?: string | null,
) {
	const fontFaces = [
		fontFamilyUrl &&
			`@font-face{font-family:"${escapeCssValue(fontFamily)}";src:url("${escapeCssValue(fontFamilyUrl)}") format("woff2");font-display:swap;}`,
		fontDisplayUrl &&
			`@font-face{font-family:"${escapeCssValue(fontDisplay)}";src:url("${escapeCssValue(fontDisplayUrl)}") format("woff2");font-display:swap;}`,
	]
		.filter(Boolean)
		.join("");

	return `${fontFaces}:root{--font-sans:"${escapeCssValue(fontFamily)}", system-ui, sans-serif;--font-display:"${escapeCssValue(fontDisplay)}", "${escapeCssValue(fontFamily)}", system-ui, sans-serif}`;
}
