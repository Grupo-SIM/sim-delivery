import { describe, expect, test } from "bun:test";
import { buildUtmSearch } from "./utm-search";

const link = { campaign: "branding_instagram", content: "link_in_bio", medium: "social", source: "ig" };

describe("buildUtmSearch", () => {
	test("keeps the link UTMs and every extra param", () => {
		const search = buildUtmSearch(link, { fbclid: "AbC", gclid: "x", utm_term: "pizza" });
		expect(search).toEqual({ ...Object.fromEntries(Object.entries(link).map(([k, v]) => [`utm_${k}`, v])), fbclid: "AbC", gclid: "x", utm_term: "pizza" });
	});

	test("link UTMs win over incoming ones, even when the link leaves one unset", () => {
		const search = buildUtmSearch({ source: "ig" }, { utm_content: "spam", utm_source: "spam" });
		expect(search).toEqual({ utm_source: "ig" });
	});
});
