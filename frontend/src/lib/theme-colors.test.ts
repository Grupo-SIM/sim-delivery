import { describe, expect, it } from "bun:test";
import { defaultThemeColors, resolveThemeColors } from "./theme-colors";

describe("resolveThemeColors", () => {
	it("uses default colors when branding has no theme", () => {
		expect(resolveThemeColors(null)).toBe(defaultThemeColors);
	});

	it("uses the saved theme colors when present", () => {
		const themeColors = {
			dark: { ...defaultThemeColors.dark, primary: "#111111" },
			light: { ...defaultThemeColors.light, primary: "#222222" },
		};

		expect(resolveThemeColors(themeColors)).toBe(themeColors);
	});
});
