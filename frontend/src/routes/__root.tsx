import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useBrandingFavicon } from "@/hooks/use-branding-favicon";
import { useBrandingTheme } from "@/hooks/use-branding-theme";
import { useTracking } from "@/hooks/use-tracking";
import { useSyncSession } from "@/hooks/useSyncSession";
import { useGetBranding } from "@/lib/api";
import { slug } from "@/lib/variant";

function RootComponent() {
	useSyncSession();

	const { data: branding } = useGetBranding({ slug });

	useTracking({
		ga4Id: branding?.ga4Id,
		gtmId: branding?.gtmId,
		metaPixelId: branding?.metaPixelId,
	});
	useBrandingTheme(branding?.themeColors, branding?.primaryColor);
	useBrandingFavicon(branding?.logoUrl);

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
