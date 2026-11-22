import { describe, expect, test } from "bun:test";
import { normalizeUtmPath, normalizeUtmUrl, utmDestinationRows, utmLinkColumns } from "./utm-link";

describe("utm link", () => {
	test("normalizes arbitrary-depth paths", () => {
		expect(normalizeUtmPath("/Influencers/Fulano_1/")).toBe("influencers/fulano_1");
		expect(normalizeUtmPath("a/b/c/d/e/f")).toBe("a/b/c/d/e/f");
	});

	test("rejects empty, too deep and unsafe paths", () => {
		for (const path of ["", "/", "a/b/c/d/e/f/g", "a b", "a/../b", "ação"]) expect(normalizeUtmPath(path)).toBeNull();
	});

	test("requires at least one UTM and lowercases values", () => {
		expect(() => utmLinkColumns({ path: "x" })).toThrow();
		expect(utmLinkColumns({ path: "x", source: " IG ", })).toMatchObject({ source: "ig" });
	});
});

describe("utm link url", () => {
	test("accepts storefront paths and http(s) URLs", () => {
		expect(normalizeUtmUrl(" /centro ")).toBe("/centro");
		expect(normalizeUtmUrl("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
		expect(normalizeUtmUrl("")).toBeNull();
	});

	test("rejects protocol-relative and non-http URLs", () => {
		for (const value of ["//evil.com", "javascript:alert(1)", "centro"]) expect(() => normalizeUtmUrl(value)).toThrow();
	});
});

describe("utm destinations", () => {
	test("unit wins over url, empty destinations are dropped, last entry per company wins", () => {
		expect(
			utmDestinationRows([
				{ companyId: "a", unitSlug: "Centro", url: "/x" },
				{ companyId: "b", url: "https://example.com" },
				{ companyId: "c", unitSlug: "", url: "" },
				{ companyId: "b", url: "/y" },
			]),
		).toEqual([
			{ companyId: "a", unitSlug: "centro", url: null },
			{ companyId: "b", unitSlug: null, url: "/y" },
		]);
	});
});
