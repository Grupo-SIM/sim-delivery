import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/ui/ErrorState";
import { useGetPublicReviews } from "@/lib/api";
import { slug } from "@/lib/variant";

interface UnitReviewsProps {
	unitId: string;
}

export function UnitReviews({ unitId }: UnitReviewsProps) {
	const { t } = useTranslation();
	const reviewsQuery = useGetPublicReviews({ slug, unitId });

	if (reviewsQuery.isError) return <ErrorState title={t("store.unit.reviews.loadError")} />;
	if (reviewsQuery.data && reviewsQuery.data.length === 0) return null;

	return (
		<section className="space-y-3">
			<h2 className="font-semibold text-lg">{t("store.unit.reviews.title")}</h2>
			<div className="grid gap-3 sm:grid-cols-2">
				{reviewsQuery.data?.map(review => (
					<div className="space-y-1 rounded-brand border border-border bg-card p-3" key={review.id}>
						<div className="flex items-center justify-between gap-2">
							<span className="font-medium text-sm">{review.customerName}</span>
							<span aria-hidden className="text-sm">
								{"⭐".repeat(Number(review.rating))}
								{"☆".repeat(5 - Number(review.rating))}
							</span>
						</div>
						{review.comment && <p className="text-muted-foreground text-sm">{review.comment}</p>}
					</div>
				))}
			</div>
		</section>
	);
}
