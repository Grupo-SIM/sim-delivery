import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { showAlert, useAuthStore } from "@/stores";
import { AddressForm, IdentifyForm } from "./components";

function CheckoutPage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const identified = useAuthStore(state => state.isAuthenticated);

	return (
		<Container className="max-w-lg space-y-6 py-8">
			<Link className="text-primary text-sm" params={{ unitId }} to="/$unitId">
				← {t("store.checkout.back")}
			</Link>

			{identified ? (
				<>
					<SectionHeading
						subtitle={t("store.checkout.address.subtitle")}
						title={t("store.checkout.address.title")}
					/>
					<AddressForm onSubmit={() => void showAlert(t("store.checkout.address.saved"))} />
				</>
			) : (
				<>
					<SectionHeading
						subtitle={t("store.checkout.identify.subtitle")}
						title={t("store.checkout.identify.title")}
					/>
					<IdentifyForm unitId={unitId} />
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/$unitId/checkout/")({
	component: CheckoutPage,
});
