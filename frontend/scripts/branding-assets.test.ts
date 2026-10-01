import { describe, expect, it } from "bun:test";
import { fetchBrandingAsset, resolveBrandingAssetUrl } from "./branding-assets";

describe("resolveBrandingAssetUrl", () => {
	it("skips unset and blank branding assets", () => {
		for (const value of [null, "", "   "]) {
			expect(resolveBrandingAssetUrl(value, "https://api.example.com")).toBeNull();
		}
	});
	it("resolves uploaded media against the API origin", () => {
		expect(resolveBrandingAssetUrl(" /media/logo.png ", "https://api.example.com")).toBe(
			"https://api.example.com/media/logo.png",
		);
	});
	it("preserves absolute asset URLs", () => {
		expect(resolveBrandingAssetUrl("https://cdn.example.com/logo.png", "https://api.example.com")).toBe(
			"https://cdn.example.com/logo.png",
		);
	});
});


describe("fetchBrandingAsset", () => {
	it("does not fetch missing assets", async () => {
		expect(await fetchBrandingAsset(null, async () => { throw new Error("Unexpected fetch"); })).toBeNull();
	});
	it("skips HTTP 404 responses", async () => {
		expect(await fetchBrandingAsset("https://example.com/logo.png", async () => new Response(null, { status: 404 }))).toBeNull();
	});
	it("skips network failures", async () => {
		expect(await fetchBrandingAsset("https://example.com/logo.png", async () => { throw new Error("Connection refused"); })).toBeNull();
	});
	it("returns successfully downloaded assets", async () => {
		const result = await fetchBrandingAsset("https://example.com/logo.png", async () => new Response("image", { headers: { "content-type": "image/png" } }));
		expect(result?.contentType).toBe("image/png");
		expect(new TextDecoder().decode(result?.bytes)).toBe("image");
	});
});
