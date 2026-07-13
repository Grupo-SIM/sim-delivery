import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useTracking } from "@/hooks/use-tracking";
import { useSyncSession } from "@/hooks/useSyncSession";
import { buildBranding } from "@/lib/build-branding";

function RootComponent() {
	useSyncSession();

	useTracking({
		ga4Id: buildBranding.ga4Id,
		gtmId: buildBranding.gtmId,
		metaPixelId: buildBranding.metaPixelId,
	});

	return (
		<div className="min-h-screen bg-background text-foreground">
			<main>
				<Outlet />
			</main>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
});
