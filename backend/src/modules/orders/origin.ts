import type { OrderOrigin, OrderOriginReturn, UtmSet } from "./dtos";

const FIELDS = ["Source", "Medium", "Campaign", "Content", "Term"] as const;

function clean(value: string | undefined) {
	const normalized = value?.replace(/[\u0000-\u001f\u007f]/g, "").trim().toLowerCase().slice(0, 200);
	return normalized || null;
}

/** Flattens the client-sent origin into the `Order.firstUtm*`/`lastUtm*`/`fbclid` columns. */
export function originColumns(origin: OrderOrigin | undefined) {
	if (!origin) return {};
	const columns: Record<string, string | null> = { fbclid: origin.fbclid ?? null };
	for (const [kind, set] of [["first", origin.first], ["last", origin.last ?? origin.first]] as [string, UtmSet | undefined][]) {
		for (const field of FIELDS) columns[`${kind}Utm${field}`] = clean(set?.[field.toLowerCase() as keyof UtmSet]);
	}
	return columns;
}

type OriginRow = { [K in `${"first" | "last"}Utm${(typeof FIELDS)[number]}`]: string | null };

/** Null when the order carries no UTM at all (direct access). */
export function readOrigin(row: OriginRow): OrderOriginReturn | null {
	const pick = (kind: "first" | "last") => ({
		campaign: row[`${kind}UtmCampaign`],
		content: row[`${kind}UtmContent`],
		medium: row[`${kind}UtmMedium`],
		source: row[`${kind}UtmSource`],
		term: row[`${kind}UtmTerm`],
	});
	const first = pick("first");
	const last = pick("last");
	return [...Object.values(first), ...Object.values(last)].some(Boolean) ? { first, last } : null;
}
