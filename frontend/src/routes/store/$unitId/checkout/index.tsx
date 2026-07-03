import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { showAlert } from "@/stores";
import { AddressForm } from "./components";

function CheckoutPage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();

	return (
		<Container className="max-w-lg space-y-6 py-8">
			<Link className="text-primary text-sm" params={{ unitId }} to="/store/$unitId">
				← {t("store.checkout.back")}
			</Link>

			<SectionHeading
				subtitle={t("store.checkout.address.subtitle")}
				title={t("store.checkout.address.title")}
			/>

			<AddressForm onSubmit={() => void showAlert(t("store.checkout.address.saved"))} />
		</Container>
	);
}

export const Route = createFileRoute("/store/$unitId/checkout/")({
	component: CheckoutPage,
});
