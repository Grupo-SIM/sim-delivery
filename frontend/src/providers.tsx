import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useLayoutEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { useLiveBranding } from "./hooks/use-live-branding";
import { useThemePreference } from "./hooks/use-theme-preference";
import { fontsToCss, loadGoogleFont } from "./lib/google-fonts";
import { reactQueryClient } from "./lib/tanstack";
import { themeColorsToCss } from "./lib/theme-colors";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={reactQueryClient}>
			<BrandedProviders>{children}</BrandedProviders>
		</QueryClientProvider>
	);
}
function BrandedProviders({ children }: { children: ReactNode }) {
	const {
		allowThemeToggle,
		defaultTheme,
		fontDisplay,
		fontDisplayUrl,
		fontFamily,
		fontFamilyUrl,
		themeColors,
	} = useLiveBranding();
	const { mode } = useThemePreference(allowThemeToggle, defaultTheme);
	useLayoutEffect(() => {
		document.documentElement.classList.toggle("dark", mode === "dark");
		document.documentElement.classList.toggle("light", mode === "light");
	}, [mode]);
	useEffect(() => {
		let style = document.getElementById("live-branding-theme") as HTMLStyleElement | null;
		if (!style) {
			style = document.createElement("style");
			style.id = "live-branding-theme";
			document.head.appendChild(style);
		}
		style.textContent = themeColorsToCss(themeColors);
	}, [themeColors]);
	useEffect(() => {
		if (!fontFamilyUrl) loadGoogleFont(fontFamily);
		if (!fontDisplayUrl) loadGoogleFont(fontDisplay);
		let style = document.getElementById("live-branding-fonts") as HTMLStyleElement | null;
		if (!style) {
			style = document.createElement("style");
			style.id = "live-branding-fonts";
			document.head.appendChild(style);
		}
		style.textContent = fontsToCss(fontFamily, fontDisplay, fontFamilyUrl, fontDisplayUrl);
	}, [fontDisplay, fontDisplayUrl, fontFamily, fontFamilyUrl]);
	return (
		<>
			{children}
			<ConfirmDialog />
			<ToastContainer autoClose={4000} position="top-right" theme={mode} />
		</>
	);
}
