import { describe, expect, it } from "bun:test";
import { defaultThemeColors, resolveThemeColors, feedbackForeground, themeColorsToCss, toThemeVariable } from "./theme-colors";

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

 describe("theme CSS", () => {
 it("preserves every saved token in both modes and derives feedback ink separately", () => {
  const colors = structuredClone(defaultThemeColors);
  colors.light.primary = "#123456";
  colors.light.secondary = "#ABCDEF";
  colors.light.accent = "#FFFF00";
  colors.light.destructive = "#B3261E";
  colors.dark.success = "#65D894";
  const before = structuredClone(colors);
  const css = themeColorsToCss(colors);
  for (const mode of ["light", "dark"] as const) {
   const block = css.split(mode === "light" ? ":root{" : ":root.dark{")[1].split("}")[0];
   for (const [key, value] of Object.entries(colors[mode])) {
    expect(block).toContain(`--${toThemeVariable(key as keyof typeof colors.light)}:${value}`);
   }
  }
  expect(css).toContain("--destructive-foreground:#FFFFFF");
  expect(css).toContain("--success-foreground:#000000");
  expect(colors).toEqual(before);
  expect(resolveThemeColors(colors)).toBe(colors);
 });
 it("chooses readable feedback ink independently of page or brand text", () => {
  expect(feedbackForeground("#FFFFFF")).toBe("#000000");
  expect(feedbackForeground("#000000")).toBe("#FFFFFF");
  expect(feedbackForeground("#F5BA00")).toBe("#000000");
  expect(feedbackForeground("#C71552")).toBe("#FFFFFF");
 });
});
