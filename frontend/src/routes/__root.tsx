import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConsentPreferences, CookieBanner } from "@/components/consent";
import { useConsentStore } from "@/stores/consent";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useTracking } from "@/hooks/use-tracking";
import { useSyncSession } from "@/hooks/useSyncSession";

function RootComponent() {
	useSyncSession();
	const preferencesOpen = useConsentStore(state => state.preferencesOpen);

	const branding = useLiveBranding();
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
			<CookieBanner />
			{preferencesOpen && <ConsentPreferences />}
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
});
