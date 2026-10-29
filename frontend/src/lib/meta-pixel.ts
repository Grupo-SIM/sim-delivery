import { hasMarketingConsent } from "@/stores/consent";

type MetaEvent = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "AddPaymentInfo" | "CompleteRegistration" | "Search" | "Contact";
type MetaPayload = Record<string, unknown>;
let pixelId: string | null = null;
const readyListeners = new Set<() => void>();

export function onMetaPixelReady(listener: () => void) {
	readyListeners.add(listener);
	listener();
	return () => { readyListeners.delete(listener); };
}

/** Loader owns initialization; target only the active tenant's pixel. */
export function setMetaPixelId(id: string | null) {
	pixelId = id && /^\d+$/.test(id) ? id : null;
	if (pixelId) for (const listener of readyListeners) {
		try { listener(); } catch { /* Optional consumers must not break the loader. */ }
	}
}

/** Never queue events before consent, and never let tracking break commerce. */
export function trackMetaEvent(event: MetaEvent, payload: MetaPayload = {}, eventId?: string): boolean {
	if (typeof window === "undefined" || !hasMarketingConsent() || !pixelId) return false;
	try {
		const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
		if (typeof fbq !== "function") return false;
		fbq("trackSingle", pixelId, event, payload, ...(eventId ? [{ eventID: eventId }] : []));
		return true;
	} catch {
		return false;
	}
}
