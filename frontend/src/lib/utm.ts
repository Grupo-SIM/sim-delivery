/**
 * First-party campaign origin (UTMs). Runs before the router so the params are captured on the very first
 * load, whatever route redirects happen afterwards. Independent of marketing consent: UTM labels hold no
 * personal data. `first` is written once and never overwritten; `last` follows the latest tagged visit.
 * `fbclid` is kept apart and never used as an origin identifier.
 */
const STORAGE_KEY = "utm-origin";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const KEYS = ["source", "medium", "campaign", "content", "term"] as const;

export type Utm = Partial<Record<(typeof KEYS)[number], string>>;
interface StoredOrigin { capturedAt: number; fbclid?: string; first: Utm; last: Utm }

function clean(value: string | null) {
	const text = value?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
	return text && text.length <= 200 ? text.toLowerCase() : undefined;
}

function read(): StoredOrigin | undefined {
	try {
		const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as StoredOrigin | null;
		if (value && typeof value.capturedAt === "number" && Date.now() - value.capturedAt < MAX_AGE_MS && value.first) return value;
	} catch { /* Storage can be blocked. */ }
	return undefined;
}

export function parseUtm(search: string): Utm {
	const params = new URLSearchParams(search);
	return Object.fromEntries(KEYS.flatMap(key => {
		const value = clean(params.get(`utm_${key}`));
		return value ? [[key, value]] : [];
	}));
}

export function captureUtm(search = typeof window === "undefined" ? "" : window.location.search) {
	if (typeof window === "undefined") return;
	try {
		const utm = parseUtm(search);
		if (!Object.keys(utm).length) return;
		const rawFbclid = new URLSearchParams(search).get("fbclid");
		const fbclid = rawFbclid && /^[A-Za-z0-9_-]{1,500}$/.test(rawFbclid) ? rawFbclid : undefined;
		const previous = read();
		const value: StoredOrigin = {
			capturedAt: previous?.capturedAt ?? Date.now(),
			fbclid: fbclid ?? previous?.fbclid,
			first: previous?.first ?? utm,
			last: utm,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch { /* Attribution is optional. */ }
}

/** Payload for `CreateOrder.origin`, undefined when the visit never carried UTMs. */
export function getOrigin() {
	if (typeof window === "undefined") return undefined;
	const value = read();
	return value ? { fbclid: value.fbclid, first: value.first, last: value.last } : undefined;
}
