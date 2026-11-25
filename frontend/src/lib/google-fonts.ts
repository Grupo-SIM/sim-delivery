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

/** Page URLs (e.g. fonts.google.com/specimen/X) are not font files and fail CORS; Google families load via stylesheet. */
export function isFontFile(url?: string | null): url is string {
	return !!url && !/^https?:\/\/fonts\.google\.com\//i.test(url);
}

const FONT_FORMATS: Record<string, string> = { otf: "opentype", ttf: "truetype", woff: "woff", woff2: "woff2" };

/** `@font-face` for an uploaded font file; the format hint follows the extension so non-woff2 uploads still load. */
export function fontFaceCss(family: string, url: string) {
	const extension = url.split(/[?#]/, 1)[0].split(".").pop()?.toLowerCase() ?? "";
	const format = FONT_FORMATS[extension] ? ` format("${FONT_FORMATS[extension]}")` : "";
	return `@font-face{font-family:"${escapeCssValue(family)}";src:url("${escapeCssValue(url)}")${format};font-display:swap;}`;
}

export function fontsToCss(
	fontFamily: string,
	fontDisplay: string,
	fontFamilyUrl?: string | null,
	fontDisplayUrl?: string | null,
) {
	const fontFaces = [
		isFontFile(fontFamilyUrl) && fontFaceCss(fontFamily, fontFamilyUrl),
		isFontFile(fontDisplayUrl) && fontFaceCss(fontDisplay, fontDisplayUrl),
	]
		.filter(Boolean)
		.join("");

	return `${fontFaces}:root{--font-sans:"${escapeCssValue(fontFamily)}", system-ui, sans-serif;--font-display:"${escapeCssValue(fontDisplay)}", "${escapeCssValue(fontFamily)}", system-ui, sans-serif}`;
}
