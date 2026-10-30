import { postUsersRegistrationEvent } from "@/lib/api";
import { onMetaPixelReady, trackMetaCustomEvent, trackMetaEvent } from "@/lib/meta-pixel";
import { hasMarketingConsent } from "@/stores/consent";

const pending = new Map<string, Promise<void>>();
const STARTED_KEY = "registration-started";

/** Once per browser session, on the first keystroke in the identify form. */
export function trackRegistrationStart() {
	if (!hasMarketingConsent()) return;
	try {
		if (sessionStorage.getItem(STARTED_KEY)) return;
		if (trackMetaCustomEvent("StartRegistration", {}, `start_registration_${crypto.randomUUID()}`)) sessionStorage.setItem(STARTED_KEY, "1");
	} catch { /* Tracking is optional. */ }
}

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
