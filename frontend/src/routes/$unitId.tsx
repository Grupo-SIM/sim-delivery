import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useBrandingTheme } from "@/hooks/use-branding-theme";
import { useTracking } from "@/hooks/use-tracking";
import { useGetBranding } from "@/lib/api";

function UnitLayout() {
	const { unitId } = Route.useParams();
	const { data: branding } = useGetBranding({ unitId });

	useTracking({
		ga4Id: branding?.ga4Id,
		gtmId: branding?.gtmId,
		metaPixelId: branding?.metaPixelId,
	});
	useBrandingTheme(branding?.themeColors, branding?.primaryColor);

	return <Outlet />;
}

export const Route = createFileRoute("/$unitId")({
	component: UnitLayout,
});
