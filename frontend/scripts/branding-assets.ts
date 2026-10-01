/** Empty branding must not trigger asset downloads during initial deployment. */
export function resolveBrandingAssetUrl(value: string | null, apiUrl: string): string | null {
	const source = value?.trim();
	if (!source) return null;
	return new URL(source, `${apiUrl.replace(/\/$/, "")}/`).href;
}

/** Branding services may be unavailable while the first deployment is being built. */
export async function fetchBrandingAsset(
	url: string | null,
	fetchAsset: (url: string) => Promise<Response> = fetch,
): Promise<{ bytes: ArrayBuffer; contentType: string | null } | null> {
	if (!url) return null;
	try {
		const response = await fetchAsset(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return { bytes: await response.arrayBuffer(), contentType: response.headers.get("content-type") };
	} catch (error) {
		console.warn(`Skipping unavailable branding asset ${url}:`, error);
		return null;
	}
}
