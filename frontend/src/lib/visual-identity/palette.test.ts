import { describe, expect, test } from "bun:test";
import { defaultThemeColors } from "@/lib/theme-colors";
import { companyPalette, referenceThemeColors, validatePalette } from "./palette";

describe("visual identity palette", () => {
	test("preserves complete company colors and copies values", () => {
		const result = validatePalette(referenceThemeColors);
		expect(result).toEqual(referenceThemeColors);
		result.light.primary = "#123456";
		expect(referenceThemeColors.light.primary).toBe("#8E1B2E");
	});
	test("rejects incomplete palettes without modifying defaults", () => {
		const incomplete = structuredClone(referenceThemeColors);
		Reflect.deleteProperty(incomplete.dark, "primary");
		expect(() => validatePalette(incomplete)).toThrow();
		expect(defaultThemeColors.light.primary).toBe("#000000");
	});
	test("rejects CSS injection and non-HEX colors", () => {
		for (const color of ["red", "#fff", "#123456; background:url(https://example.test)"]) {
			const palette = structuredClone(referenceThemeColors);
			palette.light.primary = color;
			expect(() => validatePalette(palette)).toThrow();
		}
	});
	test("uses app defaults for companies without branding", () => {
		expect(companyPalette(null)).toEqual(defaultThemeColors);
	});
});
