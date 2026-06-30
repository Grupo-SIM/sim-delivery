import { createDarkTheme, createLightTheme } from "baseui";

export type ThemeMode = "dark" | "light";

export const lightTheme = createLightTheme({
	colors: {
		accent: "#0079bd",
		backgroundPrimary: "#f7f8fa",
		backgroundSecondary: "#ffffff",
		backgroundTertiary: "#eef1f4",
		borderOpaque: "#d7dee7",
		borderSelected: "#dc3a00",
		buttonPrimaryFill: "#dc3a00",
		buttonPrimaryHover: "#b83200",
		buttonPrimaryText: "#ffffff",
		contentInverseSecondary: "#ffffff",
		contentPrimary: "#14171b",
		contentSecondary: "#53606c",
		contentTertiary: "#6b7785",
		inputBorder: "#c9d2dd",
		inputFill: "#ffffff",
		inputFillActive: "#ffffff",
		inputTextDisabled: "#6b7785",
		negative: "#c92a38",
		positive: "#168238",
		warning: "#a86000",
	},
});

export const darkTheme = createDarkTheme({
	colors: {
		accent: "#0099ed",
		backgroundPrimary: "#101419",
		backgroundSecondary: "#14171b",
		backgroundTertiary: "#1c2026",
		borderOpaque: "#2a2e35",
		borderSelected: "#ff5b16",
		buttonPrimaryFill: "#ff5b16",
		buttonPrimaryHover: "#e64f0d",
		buttonPrimaryText: "#ffffff",
		contentInverseSecondary: "#ffffff",
		contentPrimary: "#dfe2eb",
		contentSecondary: "#9aa7b4",
		contentTertiary: "#c3c7cc",
		inputBorder: "#2a2e35",
		inputFill: "#0a0e14",
		inputFillActive: "#0a0e14",
		inputTextDisabled: "#9aa7b4",
		negative: "#dc3545",
		positive: "#28a745",
		warning: "#f59e0b",
	},
});

export function getAppTheme(mode: ThemeMode) {
	return mode === "dark" ? darkTheme : lightTheme;
}
