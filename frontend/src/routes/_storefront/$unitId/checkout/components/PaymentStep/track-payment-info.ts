import { trackMetaEvent } from "@/lib/meta-pixel";

const STORAGE_KEY = "meta:add-payment-info-orders";

function readTracked(): string[] {
	try {
		const parsed: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]");
		return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
	} catch {
		return [];
	}
}

function markTracked(orderId: string) {
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...readTracked(), orderId].slice(-20)));
	} catch { /* Storage unavailable: tracking must never break checkout. */ }
}

/** AddPaymentInfo fires once per checkout (order), even across reloads: switching methods or retrying never repeats it. Locked only once actually sent, so pre-consent attempts don't burn it. */
export function trackAddPaymentInfoOnce(orderId: string, amountCents: number, method: "card" | "pix") {
	if (typeof window === "undefined" || readTracked().includes(orderId)) return;
	if (trackMetaEvent("AddPaymentInfo", { currency: "BRL", payment_method: method, value: amountCents / 100 })) markTracked(orderId);
}
