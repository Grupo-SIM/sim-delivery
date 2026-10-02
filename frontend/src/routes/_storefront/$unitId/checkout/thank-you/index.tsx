import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const searchSchema = z.object({
	orderId: z.string().optional(),
});

function ThankYouPage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const { orderId } = Route.useSearch();

	return (
		<Container className="max-w-lg space-y-6 py-16 text-center">
			<div className="space-y-2">
				<p className="text-5xl">🎉</p>
				<SectionHeading
					subtitle={t("store.checkout.thankYou.subtitle")}
					title={t("store.checkout.thankYou.title")}
				/>
			</div>

			<p className="text-muted-foreground text-sm">{t("store.checkout.thankYou.whatsapp")}</p>

			{orderId && (
				<Link
					className="block text-primary text-sm underline"
					params={{ unitId }}
					search={{ orderId }}
					to="/$unitId/rate"
				>
					{t("store.checkout.thankYou.rate")}
				</Link>
			)}

			<Link className="text-primary text-sm underline" params={{ unitId }} to="/$unitId">
				{t("store.checkout.thankYou.continue")}
			</Link>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/checkout/thank-you/")({
	beforeLoad: ({ params, search }) => {
		if (!search.orderId) {
			throw redirect({ params: { unitId: params.unitId }, replace: true, to: "/$unitId" });
		}
	},
	component: ThankYouPage,
	validateSearch: searchSchema,
});
