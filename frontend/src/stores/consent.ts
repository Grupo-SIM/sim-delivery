import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Bump when purposes/policy change; older decisions must be requested again. */
export const CONSENT_VERSION = "2026-10-29";

interface ConsentChoices {
	analytics: boolean;
	marketing: boolean;
}

interface ConsentState extends ConsentChoices {
	decidedAt: string | null;
	policyVersion: string;
	preferencesOpen: boolean;
	setConsent: (choices: ConsentChoices) => void;
	openPreferences: () => void;
	closePreferences: () => void;
}

/** Optional categories default denied. Only setConsent records an explicit decision. */
export const useConsentStore = create<ConsentState>()(
	persist(
		set => ({
			analytics: false,
			closePreferences: () => set({ preferencesOpen: false }),
			decidedAt: null,
			marketing: false,
			openPreferences: () => set({ preferencesOpen: true }),
			policyVersion: CONSENT_VERSION,
			preferencesOpen: false,
			setConsent: choices => set({
				analytics: choices.analytics,
				decidedAt: new Date().toISOString(),
				marketing: choices.marketing,
				policyVersion: CONSENT_VERSION,
			}),
		}),
		{
			name: "privacy-consent",
			partialize: ({ analytics, decidedAt, marketing, policyVersion }) => ({ analytics, decidedAt, marketing, policyVersion }),
			merge: (persisted, current) => {
				const saved = persisted as Partial<ConsentState> | undefined;
				if (saved?.policyVersion !== CONSENT_VERSION || typeof saved.decidedAt !== "string" || !Number.isFinite(Date.parse(saved.decidedAt)) || Date.parse(saved.decidedAt) > Date.now()) return current;
				return { ...current, analytics: saved.analytics === true, marketing: saved.marketing === true, decidedAt: saved.decidedAt };
			},
		},
	),
);

export function hasMarketingConsent() {
	return useConsentStore.getState().marketing;
}

export function getMarketingConsent() {
	const { marketing, decidedAt } = useConsentStore.getState();
	return { consentedAt: decidedAt ?? undefined, marketing, policyVersion: CONSENT_VERSION };
}
