import { describe, expect, it } from "bun:test";
import { resolveBrandingAssetUrl } from "./branding-assets";

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
