import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { StorefrontFooter, StorefrontHeader } from "./components/storefront";

function StorefrontLayout() {
	const branding = useLiveBranding();

	return (
		<div className="flex min-h-screen flex-col">
			<StorefrontHeader branding={branding} />
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>
			<StorefrontFooter branding={branding} />
		</div>
	);
}

export const Route = createFileRoute("/_storefront")({
	component: StorefrontLayout,
});
