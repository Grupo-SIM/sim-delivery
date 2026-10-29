import { CONSENT_VERSION, hasMarketingConsent } from "@/stores/consent";

const STORAGE_KEY = "marketing-attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
interface Attribution { fbc?: string; sourceUrl: string; capturedAt: number; utm?: Record<string, string> }

/** Deliberately omit query/hash: checkout and magic links may contain personal data/tokens. */
function sourceUrl() {
	return `${window.location.origin}${window.location.pathname}`;
}

export function clearAttribution() {
	if (typeof window === "undefined") return;
	try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage can be blocked. */ }
	for (const name of ["_fbp", "_fbc"]) {
		const parts = window.location.hostname.split(".");
		for (let i = 0; i < parts.length; i++) {
			document.cookie = `${name}=; Max-Age=0; path=/; domain=${parts.slice(i).join(".")}`;
		}
		document.cookie = `${name}=; Max-Age=0; path=/`;
	}
}

function readAttribution(): Attribution | undefined {
	try {
		const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Attribution | null;
		if (value && typeof value.capturedAt === "number" && value.capturedAt <= Date.now() && Date.now() - value.capturedAt < MAX_AGE_MS && typeof value.sourceUrl === "string") {
			return { ...value, fbc: typeof value.fbc === "string" && /^fb\.\d+\.\d+\.[A-Za-z0-9_-]{1,500}$/.test(value.fbc) ? value.fbc : undefined };
		}
	} catch { /* Invalid or unavailable storage is not fatal. */ }
	return undefined;
}

export function captureAttribution() {
	if (typeof window === "undefined" || !hasMarketingConsent()) return;
	try {
		const params = new URLSearchParams(window.location.search);
		const clickId = params.get("fbclid");
		const utm = Object.fromEntries(UTM_KEYS.flatMap(key => {
			const value = params.get(`utm_${key}`)?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
			return value && value.length <= 200 ? [[key, value]] : [];
		}));
		const previous = readAttribution();
		if (clickId && /^[A-Za-z0-9_-]{1,500}$/.test(clickId)) {
			if (previous?.fbc?.endsWith(`.${clickId}`)) return;
			const value: Attribution = { capturedAt: Date.now(), fbc: `fb.1.${Date.now()}.${clickId}`, sourceUrl: sourceUrl(), utm };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		} else if (!previous || Object.keys(utm).length > 0) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...previous, capturedAt: Date.now(), sourceUrl: sourceUrl(), utm: Object.keys(utm).length ? utm : previous?.utm }));
		}
	} catch { /* Attribution is optional. */ }
}

function cookie(name: string) {
	try {
		const value = document.cookie.split("; ").find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
		return value && value.length <= (name === "_fbp" ? 256 : 1024) && /^fb\.\d+\.\d+\.[A-Za-z0-9_-]{1,500}$/.test(value) ? value : undefined;
	} catch { return undefined; }
}

/** Re-read consent at submit time, never reuse an earlier consent snapshot. */
export function getCheckoutAttribution() {
	if (typeof window === "undefined" || !hasMarketingConsent()) return undefined;
	captureAttribution();
	const attribution = readAttribution();
	return {
		consent: true as const,
		consentVersion: CONSENT_VERSION,
		fbp: cookie("_fbp"),
		fbc: attribution?.fbc ?? cookie("_fbc"),
		sourceUrl: sourceUrl(),
		utm: attribution?.utm ? Object.fromEntries(UTM_KEYS.flatMap(key => {
			const value = attribution.utm?.[key];
			return typeof value === "string" && value.length <= 200 ? [[key, value]] : [];
		})) : undefined,
	};
}
