import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useGetPublicUnits } from "@/lib/api";
import { slug } from "@/lib/variant";
import { StorefrontFooter, StorefrontHeader } from "./components/storefront";

function StorefrontLayout() {
	const branding = useLiveBranding();
	const { unitId: unitSlug } = useParams({ strict: false });
	const { data: units } = useGetPublicUnits({ slug });
	const unitName = units?.find(unit => unit.slug === unitSlug)?.name;

	return (
		<div className="flex min-h-screen flex-col">
			<StorefrontHeader branding={branding} unitName={unitName} />
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
