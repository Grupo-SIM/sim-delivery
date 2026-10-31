import { trackMetaEvent } from "@/lib/meta-pixel";

const trackedOrders = new Set<string>();

/** AddPaymentInfo fires once per checkout (order): switching methods or retrying never repeats it. Locked only once actually sent, so pre-consent attempts don't burn it. */
export function trackAddPaymentInfoOnce(orderId: string, amountCents: number, method: "card" | "pix") {
	if (trackedOrders.has(orderId)) return;
	if (trackMetaEvent("AddPaymentInfo", { currency: "BRL", payment_method: method, value: amountCents / 100 })) trackedOrders.add(orderId);
}
