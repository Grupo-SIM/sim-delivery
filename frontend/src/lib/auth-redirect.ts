/** Returns an internal, non-auth route suitable for post-login navigation. */
export function getSafeAuthRedirect(value: unknown): string | undefined {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return undefined;
	if (value === "/identify" || value.startsWith("/identify?")) return undefined;
	return value;
}
