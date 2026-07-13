import { QueryClientProvider } from "@tanstack/react-query";
import { BaseProvider } from "baseui";
import { type ReactNode, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Client as Styletron } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { getAppTheme, type ThemeMode } from "./lib/baseui-theme";
import { branding } from "./lib/branding";
import { reactQueryClient } from "./lib/tanstack";

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
	const [themeMode, setThemeMode] = useState<ThemeMode>(getDocumentThemeMode);
	const [themeColors] = useState(branding.themeColors);

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

	return (
		<QueryClientProvider client={reactQueryClient}>
			<StyletronProvider value={styletron}>
				<BaseProvider theme={getAppTheme(themeMode, themeColors)}>
					{children}
					<ConfirmDialog />
					<ToastContainer autoClose={4000} position="top-right" theme={themeMode} />
				</BaseProvider>
			</StyletronProvider>
		</QueryClientProvider>
	);
}
