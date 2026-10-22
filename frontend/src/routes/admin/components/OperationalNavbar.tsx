import { useLiveBranding } from "@/hooks/use-live-branding";
import { StorefrontHeader } from "@/routes/components/storefront";
import { AdminUnitPicker } from "./AdminUnitPicker";

export function OperationalNavbar() {
	const branding = useLiveBranding();
	return (
		<div className="shrink-0">
			<StorefrontHeader
				branding={branding}
				hideUnitChange
				navbarContent={<AdminUnitPicker compact />}
				profileMenuLogoutTo="/identify"
				profileMenuOnlyLogout
				showBackToCustomerArea
				staffAction="unitSelection"
			/>
		</div>
	);
}
