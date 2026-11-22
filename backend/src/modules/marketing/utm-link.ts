import { DomainError } from "@/shared/errors";
import { MarketingErrors } from "./errors";
import type { UtmLinkBody } from "./dtos";

const SEGMENT = /^[a-z0-9][a-z0-9_-]{0,49}$/;
export const MAX_UTM_SEGMENTS = 6;

/** Lowercases and trims slashes; null when empty or any segment is not `[a-z0-9_-]`. */
export function normalizeUtmPath(path: string): string | null {
	const segments = path.trim().toLowerCase().split("/").filter(Boolean);
	if (!segments.length || segments.length > MAX_UTM_SEGMENTS || !segments.every(segment => SEGMENT.test(segment))) return null;
	return segments.join("/");
}

function clean(value: string | null | undefined) {
	const text = value?.replace(/[\u0000-\u001f\u007f]/g, "").trim().toLowerCase();
	return text ? text : null;
}

/** Validated, normalized columns. Throws on an invalid path or a link with no UTM at all. */
export function utmLinkColumns(body: UtmLinkBody) {
	const path = normalizeUtmPath(body.path);
	if (!path) throw new DomainError(MarketingErrors.UTM_LINK_INVALID_PATH);
	const columns = {
		campaign: clean(body.campaign),
		content: clean(body.content),
		medium: clean(body.medium),
		path,
		source: clean(body.source),
		unitSlug: clean(body.unitSlug),
	};
	if (!columns.source && !columns.medium && !columns.campaign && !columns.content) {
		throw new DomainError(MarketingErrors.UTM_LINK_EMPTY);
	}
	return columns;
}
