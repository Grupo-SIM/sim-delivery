/** snake_case campaign labels shown as words when no translation exists: branding_instagram -> Branding Instagram. */
export function humanizeUtm(value: string) {
	return value.replace(/[_-]+/g, " ").replace(/\b\p{L}/gu, letter => letter.toUpperCase());
}

/** Instagram link-in-bio, same definition as the backend metrics. */
export function isBioOrigin(origin: { content?: string | null; medium?: string | null; source?: string | null } | null | undefined) {
	return origin?.source === "ig" && origin.medium === "social" && origin.content === "link_in_bio";
}
