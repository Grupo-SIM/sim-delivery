import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPublicReviews } from "@/lib/api";
import { slug } from "@/lib/variant";

interface UnitReviewsProps {
	isOpen: boolean;
	onClose: () => void;
	unitId: string;
}

export function UnitReviews({ isOpen, onClose, unitId }: UnitReviewsProps) {
	const { t } = useTranslation();
	const reviewsQuery = useGetPublicReviews({ slug, unitId });

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t("store.unit.reviews.title")} urlKey="unit-reviews">
			{reviewsQuery.isPending ? (
				<div className="grid gap-3">
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : reviewsQuery.isError ? (
				<ErrorState title={t("store.unit.reviews.loadError")} />
			) : reviewsQuery.data?.length === 0 ? (
				<p className="text-muted-foreground text-sm">{t("store.unit.reviews.empty")}</p>
			) : (
				<div className="grid gap-3">
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
			)}
		</Modal>
	);
}
