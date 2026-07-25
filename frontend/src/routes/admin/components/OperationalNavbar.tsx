import { useLiveBranding } from "@/hooks/use-live-branding";
import { StorefrontHeader } from "@/routes/components/storefront";

export function OperationalNavbar() {
	const branding = useLiveBranding();
	return (
		<StorefrontHeader
			branding={branding}
			hideUnitChange
			profileMenuLogoutTo="/identify"
			profileMenuOnlyLogout
		/>
	);
}
