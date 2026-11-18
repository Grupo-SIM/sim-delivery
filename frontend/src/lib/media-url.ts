const cdnUrl = import.meta.env.VITE_CDN_URL?.replace(/\/+$/, "");

/** True when the URL points at a file served by the media CDN. */
export function isCdnMediaUrl(url: string): boolean {
	return !!cdnUrl && url.startsWith(`${cdnUrl}/`);
}
