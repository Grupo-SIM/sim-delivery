export type ThemeMode = "dark" | "light";

export function resolveThemePreference(
	allowThemeToggle: boolean,
	company: ThemeMode | null | undefined,
	account: ThemeMode | null | undefined,
	browser: ThemeMode,
): ThemeMode {
	return (allowThemeToggle ? account : undefined) ?? company ?? browser;
}
