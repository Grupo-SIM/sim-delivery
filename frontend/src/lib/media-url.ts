const cdnUrl = import.meta.env.VITE_CDN_URL?.replace(/\/+$/, "");

/** True when the URL points at a file served by the media CDN. */
export function isCdnMediaUrl(url: string): boolean {
	return !!cdnUrl && url.startsWith(`${cdnUrl}/`);
}

const defaultWidths = [200, 400, 600, 800];

/** Builds a `srcset` of CDN-resized variants; non-CDN URLs get none and render as-is. Pair with an accurate `sizes`. */
export function cdnSrcSet(url: string | null | undefined, widths: number[] = defaultWidths): string | undefined {
	if (!url || !isCdnMediaUrl(url)) return undefined;
	const base = url.split("?")[0];
	return widths.map(width => `${base}?width=${width} ${width}w`).join(", ");
}
