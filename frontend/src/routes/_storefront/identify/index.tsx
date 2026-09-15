import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";
import { isOperationalStaff, isStaff } from "@/lib/staff-guard";
import { useAuthStore } from "@/stores/auth";
import { IdentifyForm } from "../$unitId/checkout/components";

function IdentifyPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const hydrated = useAuthStore(state => state.hydrated);
	const role = useAuthStore(state => state.role);
	const { redirectTo } = Route.useSearch();

	useEffect(() => {
		if (hydrated && isAuthenticated) {
			void navigate({
				to: getSafeAuthRedirect(redirectTo) ?? (isOperationalStaff(role) ? "/admin/orders" : isStaff(role) ? "/admin" : "/orders"),
			});
		}
	}, [hydrated, isAuthenticated, role, navigate, redirectTo]);

	return (
		<div className="flex min-h-full flex-1 items-center py-6 sm:py-10">
			<Container className="max-w-md space-y-5 sm:max-w-lg sm:space-y-6 lg:max-w-xl" size="sm">
				<SectionHeading
					subtitle={t("store.account.identify.subtitle")}
					title={t("store.account.identify.title")}
				/>
				<div className="rounded-brand border border-border bg-card p-4 sm:p-7">
					<IdentifyForm enableWhatsApp returnTo={getSafeAuthRedirect(redirectTo)} />
				</div>
			</Container>
		</div>
	);
}

export const Route = createFileRoute("/_storefront/identify/")({
	component: IdentifyPage,
	validateSearch: (search: Record<string, unknown>) => ({
		redirectTo: getSafeAuthRedirect(search.redirectTo),
	}),
});
