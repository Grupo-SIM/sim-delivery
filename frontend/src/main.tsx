import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import { Providers } from "./providers";
import { reactQueryClient } from "./lib/tanstack";
import { routeTree } from "./routeTree.gen";
import "./i18n/config";
import "./globals.css";

const router = createRouter({
	context: {
		queryClient: reactQueryClient,
	},
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
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
