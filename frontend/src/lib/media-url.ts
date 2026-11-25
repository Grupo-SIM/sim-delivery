import { branding } from "@/lib/branding";

const cdnUrl = import.meta.env.VITE_CDN_URL?.replace(/\/+$/, "");

/** True when the URL points at a file served by the media CDN. */
export function isCdnMediaUrl(url: string): boolean {
	return !!cdnUrl && url.startsWith(`${cdnUrl}/`);
}

/** Resized WebP variant, generated and cached by the backend (`GET /media/:filename?width=N`). */
function variantUrl(url: string, width: number): string {
	const filename = url.split("?")[0].split("/").pop();
	return `${branding.apiUrl.replace(/\/+$/, "")}/media/${filename}?width=${width}`;
}

const defaultWidths = [160, 240, 320, 400, 480, 640, 800];

/** Builds a `srcset` of CDN-resized variants; non-CDN URLs get none and render as-is. Pair with an accurate `sizes`. */
export function cdnSrcSet(url: string | null | undefined, widths: number[] = defaultWidths): string | undefined {
	if (!url || !isCdnMediaUrl(url)) return undefined;
	return widths.map(width => `${variantUrl(url, width)} ${width}w`).join(", ");
}

/** Single CDN-resized variant of an image (e.g. a logo shown at a known size); other URLs are returned unchanged. */
export function cdnResizedUrl<T extends string | null | undefined>(url: T, width: number): T | string {
	if (!url || !isCdnMediaUrl(url)) return url;
	return variantUrl(url, width);
}
