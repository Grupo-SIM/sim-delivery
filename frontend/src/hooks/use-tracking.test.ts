import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as actualReact from "react";

mock.module("react", () => ({
	...actualReact,
	useEffect: (effect: () => void) => effect(),
	useRef: (value: unknown) => ({ current: value }),
}));
mock.module("@tanstack/react-router", () => ({ useRouterState: () => "/menu" }));
let choices = { analytics: false, marketing: false };
const store = Object.assign((selector: (state: typeof choices) => unknown) => selector(choices), {
	getState: () => choices,
	subscribe: () => () => {},
});
mock.module("@/stores/consent", () => ({ useConsentStore: store }));
const clearAttribution = mock(() => {});
const captureAttribution = mock(() => {});
const setMetaPixelId = mock((_id: string | null) => {});
const trackMetaEvent = mock((_event: string) => {});
mock.module("@/lib/attribution", () => ({ captureAttribution, clearAttribution }));
mock.module("@/lib/meta-pixel", () => ({ setMetaPixelId, trackMetaEvent }));
const { useTracking } = await import("./use-tracking");

interface ScriptElement { async: boolean; id: string; src: string }
let scripts: ScriptElement[];
beforeEach(() => {
	choices = { analytics: false, marketing: false };
	scripts = [];
	Object.defineProperty(globalThis, "document", { configurable: true, value: {
		createElement: () => ({ async: false, id: "", src: "" }),
		getElementById: (id: string) => scripts.find(script => script.id === id),
		head: { appendChild: (script: ScriptElement) => scripts.push(script) },
	} });
	Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
	trackMetaEvent.mockClear();
	captureAttribution.mockClear();
});

describe("useTracking consent gating", () => {
	it("loads no vendors before optional consent", () => {
		useTracking({ ga4Id: "G-TRACKING", gtmId: "GTM-TRACKING", metaPixelId: "12345" });
		expect(scripts).toHaveLength(0);
		expect(trackMetaEvent).not.toHaveBeenCalled();
	});
	it("analytics consent never enables Meta", () => {
		choices.analytics = true;
		useTracking({ ga4Id: "G-TRACKING", gtmId: "GTM-TRACKING", metaPixelId: "12345" });
		expect(scripts.map(script => script.id)).toEqual(["ga4-G-TRACKING", "gtm-GTM-TRACKING"]);
		expect(trackMetaEvent).not.toHaveBeenCalled();
	});
	it("marketing consent enables Meta without enabling analytics", () => {
		choices.marketing = true;
		useTracking({ ga4Id: "G-TRACKING", gtmId: "GTM-TRACKING", metaPixelId: "12345" });
		expect(scripts.map(script => script.id)).toEqual(["meta-pixel-library"]);
		expect(captureAttribution).toHaveBeenCalledTimes(1);
		expect(trackMetaEvent).toHaveBeenCalledWith("PageView");
	});
	it("rejects invalid script identifiers", () => {
		choices = { analytics: true, marketing: true };
		useTracking({ ga4Id: "x';evil()", gtmId: "bad", metaPixelId: "not-numeric" });
		expect(scripts).toHaveLength(0);
	});
});
