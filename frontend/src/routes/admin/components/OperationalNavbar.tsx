import { useLiveBranding } from "@/hooks/use-live-branding";
import { StorefrontHeader } from "@/routes/components/storefront";
import { AdminUnitPicker } from "./AdminUnitPicker";

export function OperationalNavbar() {
	const branding = useLiveBranding();
	return (
		<div>
			<StorefrontHeader
				branding={branding}
				hideUnitChange
				profileMenuLogoutTo="/identify"
				profileMenuOnlyLogout
				showBackToCustomerArea
				staffAction="unitSelection"
			/>
			<div className="border-border border-b px-5 py-3">
				<div className="mx-auto max-w-6xl sm:max-w-xs sm:ml-auto">
					<AdminUnitPicker />
				</div>
			</div>
		</div>
	);
}
