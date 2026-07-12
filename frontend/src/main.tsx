import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import { reactQueryClient } from "./lib/tanstack";
import { Providers } from "./providers";
import { routeTree } from "./routeTree.gen";
import "./i18n/config";
import "./globals.css";

const router = createRouter({
	context: {
		queryClient: reactQueryClient,
	},
	defaultPreload: "intent",
	// 0 forced every hover-intent preload to re-run beforeLoad (and its authClient.getSession()
	// call) from scratch, flooding /auth/get-session. Match the server's cookieCache maxAge (60s)
	// so repeated hovers within that window reuse the last preload instead of refetching.
	defaultPreloadStaleTime: 60_000,
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Providers>
			<RouterProvider router={router} />
		</Providers>
	</StrictMode>,
);
