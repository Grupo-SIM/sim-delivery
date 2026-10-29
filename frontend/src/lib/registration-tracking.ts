import { postUsersRegistrationEvent } from "@/lib/api";
import { onMetaPixelReady, trackMetaEvent } from "@/lib/meta-pixel";
import { hasMarketingConsent } from "@/stores/consent";

const pending = new Map<string, Promise<void>>();

/** Server consumes a short-lived marker written only by actual account creation. */
export function trackNewRegistration(userId: string) {
	if (!hasMarketingConsent() || pending.has(userId)) return;
	const request = postUsersRegistrationEvent().then(result => {
		if (!result.created || !result.eventId) return;
		const send = () => trackMetaEvent("CompleteRegistration", {}, result.eventId ?? undefined);
		if (send()) return;
		// A newly authenticated page can precede the branding/Pixel loader effect.
		const unsubscribe = onMetaPixelReady(() => {
			if (send()) queueMicrotask(() => unsubscribe());
		});
		window.setTimeout(unsubscribe, 30_000);
	}).catch(() => {
		pending.delete(userId);
	});
	pending.set(userId, request);
}
