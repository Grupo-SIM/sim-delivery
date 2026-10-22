import { expect, test } from "bun:test";
import { resolveThemePreference } from "./theme-preference";

test("account preference wins when switching is allowed", () => {
	expect(resolveThemePreference(true, "dark", "light", "dark")).toBe("light");
});
test("company preference wins over browser and locked account preference", () => {
	expect(resolveThemePreference(true, "light", null, "dark")).toBe("light");
	expect(resolveThemePreference(false, "light", "dark", "dark")).toBe("light");
});
test("browser applies only without account or company preference", () => {
	expect(resolveThemePreference(true, null, "light", "dark")).toBe("light");
	expect(resolveThemePreference(true, null, null, "dark")).toBe("dark");
	expect(resolveThemePreference(true, undefined, undefined, "light")).toBe("light");
});
