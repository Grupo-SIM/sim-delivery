import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as actualReact from "react";

mock.module("react", () => ({
	...actualReact,
	useEffect: (effect: () => undefined | (() => void)) => effect(),
}));

const { useBrandingFavicon } = await import("./use-branding-favicon");

function createLink() {
	return {
		attributes: new Map<string, string>([
			["rel", "icon"],
			["type", "image/svg+xml"],
		]),
		href: "/favicon.png",
		removeAttribute(name: string) {
			this.attributes.delete(name);
			if (name === "type") this.type = "";
		},
		type: "image/svg+xml",
	};
}

describe("useBrandingFavicon", () => {
	let link: ReturnType<typeof createLink>;

	beforeEach(() => {
		link = createLink();
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: { querySelector: () => link },
		});
	});

	it("points the favicon link at the company logo", () => {
		useBrandingFavicon("https://cdn.example.com/logo.png");

		expect(link.href).toBe("https://cdn.example.com/logo.png");
		expect(link.attributes.has("type")).toBe(false);
	});

	it("does nothing when there is no logo", () => {
		useBrandingFavicon(null);

		expect(link.href).toBe("/favicon.png");
	});
});
