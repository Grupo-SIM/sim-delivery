const WEIGHTS = "400;500;600;700;800;900";

function toFamilyParam(family: string) {
	return `family=${encodeURIComponent(family.trim()).replace(/%20/g, "+")}:wght@${WEIGHTS}`;
}

export function googleFontsUrl(families: string[]) {
	const params = families.filter(family => family.trim()).map(toFamilyParam);
	return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

function googleFontLinkId(family: string) {
	return `google-font-${family.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/** Injects (once per family) a Google Fonts stylesheet link so the family becomes usable via font-family. */
export function loadGoogleFont(family: string | null | undefined) {
	if (typeof document === "undefined" || !family?.trim()) return;

	const id = googleFontLinkId(family);
	if (document.getElementById(id)) return;

	const link = document.createElement("link");
	link.id = id;
	link.rel = "stylesheet";
	link.href = googleFontsUrl([family]);
	document.head.appendChild(link);
}

/** CSS overriding --font-sans/--font-display with the company's chosen font families. */
export function fontsToCss(fontFamily: string, fontDisplay: string) {
	return `:root{--font-sans:"${fontFamily}", system-ui, sans-serif;--font-display:"${fontDisplay}", "${fontFamily}", system-ui, sans-serif}`;
}
