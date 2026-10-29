import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { captureAttribution, clearAttribution } from "@/lib/attribution";
import { setMetaPixelId, trackMetaEvent } from "@/lib/meta-pixel";
import { useConsentStore } from "@/stores/consent";

interface TrackingIds {
	ga4Id?: string | null;
	gtmId?: string | null;
	metaPixelId?: string | null;
}

type TrackingWindow = Window & {
	dataLayer?: unknown[];
	gtag?: (...args: unknown[]) => void;
	fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded?: boolean; version?: string; push?: unknown };
};

function loadScript(id: string, src: string) {
	if (document.getElementById(id)) return;
	const script = document.createElement("script");
	script.id = id;
	script.async = true;
	script.src = src;
	document.head.appendChild(script);
}

/** Revocation requires a fresh document: removing a script cannot unload executed vendor code. */
function revokeTracking() {
	setMetaPixelId(null);
	clearAttribution();
	for (const cookie of document.cookie.split(";")) {
		const name = cookie.split("=")[0]?.trim();
		if (!name || !/^(_ga(?:_|$)|_gid$|_gat(?:_|$)|_gcl_)/.test(name)) continue;
		const parts = window.location.hostname.split(".");
		for (let index = 0; index < parts.length; index++) {
			document.cookie = `${name}=; Max-Age=0; path=/; domain=${parts.slice(index).join(".")}`;
		}
		document.cookie = `${name}=; Max-Age=0; path=/`;
	}
	const target = window as TrackingWindow;
	target.fbq?.("consent", "revoke");
	target.gtag?.("consent", "update", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
	// Let the preference modal finish its history.back() before reloading the document.
	window.setTimeout(() => window.location.reload(), 150);
}

export function useTracking({ ga4Id, gtmId, metaPixelId }: TrackingIds) {
	const analytics = useConsentStore(state => state.analytics);
	const marketing = useConsentStore(state => state.marketing);
	const path = useRouterState({ select: state => state.location.pathname });
	const previous = useRef({ analytics, marketing });
	const initializedPixel = useRef<string | null>(null);
	const pageView = useRef<string | null>(null);
	const googleConsentInitialized = useRef(false);

	useEffect(() => {
		// Subscribe synchronously so queued callbacks cannot track between revocation and render.
		return useConsentStore.subscribe((next, old) => {
			if ((old.marketing && !next.marketing) || (old.analytics && !next.analytics)) revokeTracking();
		});
	}, []);

	useEffect(() => {
		if ((previous.current.analytics && !analytics) || (previous.current.marketing && !marketing)) return;
		previous.current = { analytics, marketing };
		const target = window as TrackingWindow;
		if (analytics) {
			target.dataLayer ??= [];
			target.gtag ??= function () { target.dataLayer?.push(arguments); };
			target.gtag("consent", googleConsentInitialized.current ? "update" : "default", { analytics_storage: "granted", ad_storage: marketing ? "granted" : "denied", ad_user_data: marketing ? "granted" : "denied", ad_personalization: marketing ? "granted" : "denied" });
			googleConsentInitialized.current = true;
			if (ga4Id && /^G-[A-Z0-9]+$/.test(ga4Id) && !document.getElementById(`ga4-${ga4Id}`)) {
				target.gtag("js", new Date());
				target.gtag("config", ga4Id);
				loadScript(`ga4-${ga4Id}`, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`);
			}
			if (gtmId && /^GTM-[A-Z0-9]+$/.test(gtmId) && !document.getElementById(`gtm-${gtmId}`)) {
				target.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
				loadScript(`gtm-${gtmId}`, `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
			}
		}
		if (marketing) captureAttribution();
		else clearAttribution();
		if (initializedPixel.current && initializedPixel.current !== metaPixelId) {
			// An executed vendor library cannot be safely retargeted/unloaded in-place.
			revokeTracking();
			return;
		}
		if (!marketing || !metaPixelId || !/^\d+$/.test(metaPixelId)) {
			setMetaPixelId(null);
			return;
		}
		if (!target.fbq) {
			const fbq: NonNullable<TrackingWindow["fbq"]> = (...args) => {
				if (!useConsentStore.getState().marketing && args[0] !== "consent") return;
				if (fbq.callMethod) fbq.callMethod(...args);
				else fbq.queue?.push(args);
			};
			fbq.queue = [];
			fbq.loaded = true;
			fbq.version = "2.0";
			fbq.push = fbq;
			target.fbq = fbq;
		}
		if (initializedPixel.current !== metaPixelId) {
			target.fbq("consent", "grant");
			target.fbq("init", metaPixelId);
			initializedPixel.current = metaPixelId;
			pageView.current = null;
		}
		setMetaPixelId(metaPixelId);
		loadScript("meta-pixel-library", "https://connect.facebook.net/en_US/fbevents.js");
		const pageKey = `${metaPixelId}:${path}`;
		if (pageView.current !== pageKey) {
			trackMetaEvent("PageView");
			pageView.current = pageKey;
		}
	}, [analytics, marketing, ga4Id, gtmId, metaPixelId, path]);
}
