import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useTracking } from "@/hooks/use-tracking";
import { useSyncSession } from "@/hooks/useSyncSession";
import { branding } from "@/lib/branding";

function RootComponent() {
	useSyncSession();

	useTracking({
		ga4Id: branding.ga4Id,
		gtmId: branding.gtmId,
		metaPixelId: branding.metaPixelId,
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
