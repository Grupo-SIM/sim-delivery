import { QueryClientProvider } from "@tanstack/react-query";
import { BaseProvider } from "baseui";
import { type ReactNode, useEffect, useState } from "react";
import { Client as Styletron } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { getAppTheme, type ThemeMode } from "./lib/baseui-theme";
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

	useEffect(() => {
		const syncThemeMode = () => {
			setThemeMode(getDocumentThemeMode());
		};

		syncThemeMode();

		const root = document.documentElement;
		const observer = new MutationObserver(syncThemeMode);
		observer.observe(root, { attributeFilter: ["class"], attributes: true });

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		mediaQuery.addEventListener("change", syncThemeMode);

		return () => {
			observer.disconnect();
			mediaQuery.removeEventListener("change", syncThemeMode);
		};
	}, []);

	return (
		<QueryClientProvider client={reactQueryClient}>
			<StyletronProvider value={styletron}>
				<BaseProvider theme={getAppTheme(themeMode)}>
					{children}
					<ConfirmDialog />
				</BaseProvider>
			</StyletronProvider>
		</QueryClientProvider>
	);
}
