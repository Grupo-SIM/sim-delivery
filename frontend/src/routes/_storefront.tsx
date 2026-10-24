import { createFileRoute, Outlet, useParams, useSearch } from "@tanstack/react-router";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useGetPublicUnits } from "@/lib/api";
import { slug } from "@/lib/variant";
import { StorefrontFooter, StorefrontHeader } from "./components/storefront";

function StorefrontLayout() {
	const branding = useLiveBranding();
	const { menuOnly } = useSearch({ strict: false });
	const { unitId: unitSlug } = useParams({ strict: false });
	const { data: units } = useGetPublicUnits({ slug });
	const unitName = (unitSlug ? units?.find(unit => unit.slug === unitSlug) : units?.length === 1 ? units[0] : undefined)?.name;

	return (
		<div className="storefront flex min-h-screen flex-col">
			<StorefrontHeader menuOnly={menuOnly} branding={branding} hideUnitChange={units?.length === 1} unitName={unitName} />
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>
			{!menuOnly && <StorefrontFooter branding={branding} />}
		</div>
	);
}

export const Route = createFileRoute("/_storefront")({
	component: StorefrontLayout,
});
