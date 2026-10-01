import { describe, expect, it, mock } from "bun:test";
import type { GetBrandingQueryResponse } from "@/lib/api";
import type { Branding } from "@/lib/branding";

mock.module("@/lib/api", () => ({ useGetBranding: () => ({ data: undefined }) }));

const { mergeLiveBranding } = await import("./use-live-branding");

describe("mergeLiveBranding", () => {
	it("applies the live forced theme policy together", () => {
		const staticBranding = {
			allowThemeToggle: true,
			defaultTheme: "light",
			themeColors: null,
		} as unknown as Branding;
		const liveBranding = {
			allowThemeToggle: false,
			defaultTheme: "dark",
		} as GetBrandingQueryResponse;

		expect(mergeLiveBranding(staticBranding, liveBranding)).toMatchObject({
			allowThemeToggle: false,
			defaultTheme: "dark",
		});
	});
	it("clears built branding when database branding is unset", () => {
		const staticBranding = {
			logoUrl: "/old-logo.png",
			fontFamilyUrl: "https://example.com/old-font.woff2",
			fontDisplayUrl: "https://example.com/old-display.woff2",
			themeColors: null,
		} as unknown as Branding;
		const liveBranding = {
			logoUrl: null,
			fontFamilyUrl: null,
			fontDisplayUrl: null,
			themeColors: null,
		} as GetBrandingQueryResponse;
		expect(mergeLiveBranding(staticBranding, liveBranding)).toMatchObject({
			logoUrl: "",
			fontFamilyUrl: null,
			fontDisplayUrl: null,
		});
	});

});
