import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrandWave } from "@/components/ui/BrandWave";
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
				to:
					getSafeAuthRedirect(redirectTo) ??
					(isOperationalStaff(role) ? "/admin/orders" : isStaff(role) ? "/admin" : "/orders"),
			});
		}
	}, [hydrated, isAuthenticated, role, navigate, redirectTo]);

	return (
		<div className="identify-page flex min-h-full flex-1 flex-col py-6 sm:py-10">
			<div className="identify-banner">
				<Container size="lg">
					<h1 className="font-display">{t("store.account.identify.title")}</h1>
					<p>{t("store.account.identify.subtitle")}</p>
				</Container>
				<BrandWave />
			</div>
			<Container
				className="identify-content max-w-md space-y-5 sm:max-w-lg sm:space-y-6 lg:max-w-xl"
				size="sm"
			>
				<SectionHeading
					className="identify-heading"
					subtitle={t("store.account.identify.subtitle")}
					title={t("store.account.identify.title")}
				/>
				<div className="identify-card rounded-brand border border-border bg-card text-card-foreground p-4 sm:p-7">
					<IdentifyForm
						returnTo={getSafeAuthRedirect(redirectTo)}
					/>
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
