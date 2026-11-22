import { describe, expect, test } from "bun:test";
import { normalizeUtmPath, utmLinkColumns } from "./utm-link";

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
		expect(utmLinkColumns({ path: "x", source: " IG ", unitSlug: "" })).toMatchObject({ source: "ig", unitSlug: null });
	});
});
