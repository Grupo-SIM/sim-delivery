import { describe, expect, test } from "bun:test";
import { buildUtmSearch, utmNetworks } from "./utm-networks";

describe("buildUtmSearch", () => {
	test("keeps the fixed Instagram bio UTMs and every extra param", () => {
		const search = new URLSearchParams(buildUtmSearch(utmNetworks.instagram, { fbclid: "AbC", gclid: "x", utm_term: "pizza" }));
		expect(Object.fromEntries(search)).toEqual({
			fbclid: "AbC",
			gclid: "x",
			utm_campaign: "branding_instagram",
			utm_content: "link_in_bio",
			utm_medium: "social",
			utm_source: "ig",
			utm_term: "pizza",
		});
	});

	test("fixed UTMs win over incoming ones of the same key", () => {
		const search = new URLSearchParams(buildUtmSearch(utmNetworks.instagram, { utm_source: "spam" }));
		expect(search.get("utm_source")).toBe("ig");
	});
});
