import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as actualReact from "react";

mock.module("react", () => ({
	...actualReact,
	useEffect: (effect: () => void) => effect(),
}));

const { useTracking } = await import("./use-tracking");

interface ScriptElement {
	async: boolean;
	id: string;
	src: string;
	textContent: string | null;
}

function createDocument() {
	const scripts: ScriptElement[] = [];

	return {
		createElement: (tagName: string) => {
			if (tagName === "script") {
				return { async: false, id: "", src: "", textContent: null } satisfies ScriptElement;
			}

			const nestedScripts: ScriptElement[] = [];
			return {
				set innerHTML(html: string) {
					for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
						const [, attributes, textContent] = match;
						const src = /src="([^"]+)"/.exec(attributes)?.[1] ?? "";
						nestedScripts.push({ async: /\basync\b/.test(attributes), id: "", src, textContent });
					}
				},
				querySelectorAll: (selector: string) => (selector === "script" ? nestedScripts : []),
			};
		},
		getElementById: (id: string) => scripts.find(script => script.id === id) ?? null,
		head: {
			appendChild: (script: ScriptElement) => scripts.push(script),
		},
		get scripts() {
			return scripts;
		},
	};
}

describe("useTracking", () => {
	let documentStub: ReturnType<typeof createDocument>;

	beforeEach(() => {
		documentStub = createDocument();
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: documentStub,
		});
	});

	it("injects the GA4 loader and configuration for its ID", () => {
		useTracking({ ga4Id: "G-TRACKING" });

		expect(documentStub.scripts).toHaveLength(2);
		expect(documentStub.scripts[0]).toMatchObject({
			id: "ga4-G-TRACKING",
			src: "https://www.googletagmanager.com/gtag/js?id=G-TRACKING",
		});
		expect(documentStub.scripts[1]).toMatchObject({ id: "ga4-init-G-TRACKING" });
		expect(documentStub.scripts[1].textContent).toContain("gtag('config','G-TRACKING')");
	});

	it("injects the GTM bootstrap with its container ID", () => {
		useTracking({ gtmId: "GTM-TRACKING" });

		expect(documentStub.scripts).toHaveLength(1);
		expect(documentStub.scripts[0]).toMatchObject({ id: "gtm-GTM-TRACKING" });
		expect(documentStub.scripts[0].textContent).toContain("'GTM-TRACKING'");
		expect(documentStub.scripts[0].textContent).toContain("https://www.googletagmanager.com/gtm.js");
	});

	it("injects Meta Pixel initialization and PageView for its ID", () => {
		useTracking({ metaPixelId: "123456789" });

		expect(documentStub.scripts).toHaveLength(1);
		expect(documentStub.scripts[0]).toMatchObject({ id: "meta-pixel-123456789" });
		expect(documentStub.scripts[0].textContent).toContain("fbq('init','123456789')");
		expect(documentStub.scripts[0].textContent).toContain("fbq('track','PageView')");
	});

	it("does not inject scripts when tracking IDs are empty", () => {
		useTracking({ ga4Id: "", gtmId: null, metaPixelId: undefined });

		expect(documentStub.scripts).toHaveLength(0);
	});

	it("does not inject duplicate scripts for unchanged IDs", () => {
		const ids = { ga4Id: "G-TRACKING", gtmId: "GTM-TRACKING", metaPixelId: "123456789" };

		useTracking(ids);
		useTracking(ids);

		expect(documentStub.scripts.map(script => script.id)).toEqual([
			"ga4-G-TRACKING",
			"ga4-init-G-TRACKING",
			"gtm-GTM-TRACKING",
			"meta-pixel-123456789",
		]);
	});
});
