/** Empty branding must not trigger asset downloads during initial deployment. */
export function resolveBrandingAssetUrl(value: string | null, apiUrl: string): string | null {
	const source = value?.trim();
	if (!source) return null;
	return new URL(source, `${apiUrl.replace(/\/$/, "")}/`).href;
}
