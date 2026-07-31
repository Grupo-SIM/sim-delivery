import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductReviewsTab, UnitReviewsTab } from "./components";

function ReviewsPage() {
	const { t } = useTranslation();
	const { tab } = Route.useSearch();

	const tabs = [
		{ key: "units", label: t("admin.reviews.tabs.units") },
		{ key: "products", label: t("admin.reviews.tabs.products") },
	] as const;

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.reviews.subtitle")} title={t("admin.reviews.title")} />

			<div className="flex gap-1 border-border border-b">
				{tabs.map(({ key, label }) => (
					<Link
						className={`-mb-px border-b-2 px-4 py-2 font-medium text-sm transition-colors ${
							tab === key
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
						key={key}
						search={{ tab: key }}
						to="/admin/reviews"
					>
						{label}
					</Link>
				))}
			</div>

			{tab === "units" ? <UnitReviewsTab /> : <ProductReviewsTab />}
		</Container>
	);
}

export const Route = createFileRoute("/admin/reviews/")({
	component: ReviewsPage,
	validateSearch: z.object({
		tab: z.enum(["units", "products"]).default("units"),
	}),
});
