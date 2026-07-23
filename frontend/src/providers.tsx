import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { Button } from "./components/ui/button";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { useLiveBranding } from "./hooks/use-live-branding";
import { fontsToCss, loadGoogleFont } from "./lib/google-fonts";
import { reactQueryClient } from "./lib/tanstack";
import { themeColorsToCss } from "./lib/theme-colors";

export function Providers({ children }: { children: ReactNode }) {
	return <QueryClientProvider client={reactQueryClient}><BrandedProviders>{children}</BrandedProviders></QueryClientProvider>;
}
function BrandedProviders({ children }: { children: ReactNode }) {
	const { allowThemeToggle, fontDisplay, fontDisplayUrl, fontFamily, fontFamilyUrl, themeColors } = useLiveBranding();
	const [dark, setDark] = useState(false);
	useEffect(() => { document.documentElement.classList.toggle("dark", dark); document.documentElement.classList.toggle("light", !dark); }, [dark]);
	useEffect(() => { let style = document.getElementById("live-branding-theme") as HTMLStyleElement | null; if (!style) { style = document.createElement("style"); style.id = "live-branding-theme"; document.head.appendChild(style); } style.textContent = themeColorsToCss(themeColors); }, [themeColors]);
	useEffect(() => { if (!fontFamilyUrl) loadGoogleFont(fontFamily); if (!fontDisplayUrl) loadGoogleFont(fontDisplay); let style = document.getElementById("live-branding-fonts") as HTMLStyleElement | null; if (!style) { style = document.createElement("style"); style.id = "live-branding-fonts"; document.head.appendChild(style); } style.textContent = fontsToCss(fontFamily, fontDisplay, fontFamilyUrl, fontDisplayUrl); }, [fontDisplay, fontDisplayUrl, fontFamily, fontFamilyUrl]);
	return <>{children}{allowThemeToggle && <Button aria-label={dark ? "Usar tema claro" : "Usar tema escuro"} className="fixed right-4 bottom-4 z-50 rounded-full shadow-lg" onClick={() => setDark(value => !value)} size="icon" type="button" variant="outline">{dark ? <LuSun /> : <LuMoon />}</Button>}<ConfirmDialog /><ToastContainer autoClose={4000} position="top-right" theme={dark ? "dark" : "light"} /></>;
}
