import { QueryClientProvider } from "@tanstack/react-query";
import { BaseProvider } from "baseui";
import { type ReactNode, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Client as Styletron } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { useLiveBranding } from "./hooks/use-live-branding";
import { getAppTheme, type ThemeMode } from "./lib/baseui-theme";
import { reactQueryClient } from "./lib/tanstack";
import { themeColorsToCss } from "./lib/theme-colors";

const styletron = new Styletron();

interface ProvidersProps {
	children: ReactNode;
}

function getDocumentThemeMode(): ThemeMode {
	if (typeof document === "undefined") {
		return "light";
	}

	const root = document.documentElement;
	if (root.classList.contains("dark")) {
		return "dark";
	}
	if (root.classList.contains("light")) {
		return "light";
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function Providers({ children }: ProvidersProps) {
	return (
		<QueryClientProvider client={reactQueryClient}>
			<BrandedProviders>{children}</BrandedProviders>
		</QueryClientProvider>
	);
}

function BrandedProviders({ children }: ProvidersProps) {
	const [themeMode, setThemeMode] = useState<ThemeMode>(getDocumentThemeMode);
	const { themeColors } = useLiveBranding();

	useEffect(() => {
		const syncThemeMode = () => {
			setThemeMode(getDocumentThemeMode());
		};

		syncThemeMode();

		const root = document.documentElement;
		const observer = new MutationObserver(syncThemeMode);
		observer.observe(root, { attributeFilter: ["class"], attributes: true });

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		// No manual light/dark toggle exists yet — the app always mirrors the OS preference live.
		const applySystemPreference = () => {
			root.classList.toggle("dark", mediaQuery.matches);
			root.classList.toggle("light", !mediaQuery.matches);
		};
		applySystemPreference();
		mediaQuery.addEventListener("change", applySystemPreference);

		return () => {
			observer.disconnect();
			mediaQuery.removeEventListener("change", applySystemPreference);
		};
	}, []);

	useEffect(() => {
		// Overrides the build-time /branding.css link once live colors are fetched, so an admin
		// edit updates Tailwind's CSS vars without requiring a rebuild.
		let style = document.getElementById("live-branding-theme") as HTMLStyleElement | null;
		if (!style) {
			style = document.createElement("style");
			style.id = "live-branding-theme";
			document.head.appendChild(style);
		}
		style.textContent = themeColorsToCss(themeColors);
	}, [themeColors]);

	return (
		<StyletronProvider value={styletron}>
			<BaseProvider theme={getAppTheme(themeMode, themeColors)}>
				{children}
				<ConfirmDialog />
				<ToastContainer autoClose={4000} position="top-right" theme={themeMode} />
			</BaseProvider>
		</StyletronProvider>
	);
}
