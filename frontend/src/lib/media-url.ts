const cdnUrl = import.meta.env.VITE_CDN_URL?.replace(/\/+$/, "");

/** Bunny Optimizer image classes; create them in the pull zone's Dynamic images API. */
export type MediaImageClass = "full" | "thumb";

/** True when the URL points at a file served by the media CDN. */
export function isCdnMediaUrl(url: string): boolean {
	return !!cdnUrl && url.startsWith(`${cdnUrl}/`);
}

/** Requests a pre-sized image class for CDN media. Any other URL (external, blob/data, unset CDN) is returned untouched. */
export function mediaUrl(url: string, imageClass: MediaImageClass = "thumb"): string {
	if (!isCdnMediaUrl(url)) return url;

	const parsed = new URL(url);
	parsed.searchParams.set("class", imageClass);
	return parsed.href;
}
