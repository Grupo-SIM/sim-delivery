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
});
