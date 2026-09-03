import { LuStar } from "react-icons/lu";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/TextField";
import { usePostProductReviews } from "@/lib/api";
import { slug } from "@/lib/variant";

interface ProductRatingRowProps {
	orderId: string;
	productId: string;
	productName: string;
}

export function ProductRatingRow({ orderId, productId, productName }: ProductRatingRowProps) {
	const { t } = useTranslation();
	const [rating, setRating] = useState(0);
	const [hovered, setHovered] = useState(0);
	const [comment, setComment] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [errorKey, setErrorKey] = useState<string | null>(null);

	const { isPending, mutate } = usePostProductReviews();

	function submit() {
		if (rating === 0) return;
		setErrorKey(null);
		mutate(
			{ data: { comment: comment.trim() || undefined, orderId, productId, rating, slug: slug ?? "" } },
			{
				onError: (err: { status?: number }) => {
					if (err.status === 409) setErrorKey("store.rate.products.alreadyReviewed");
					else if (err.status === 422) setErrorKey("store.rate.notEligible");
					else setErrorKey("store.rate.products.error");
				},
				onSuccess: () => setSubmitted(true),
			},
		);
	}

	if (submitted) {
		return (
			<div className="rounded-brand border border-border bg-card p-4 text-muted-foreground text-sm">
				{productName} — {t("store.rate.products.submitted")}
			</div>
		);
	}

	return (
		<div className="space-y-3 rounded-brand border border-border bg-card p-4">
			<p className="font-medium text-sm">{productName}</p>
			<div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
				{[1, 2, 3, 4, 5].map(star => {
					const isSelected = (hovered || rating) >= star;

					return (
						<button
						aria-label={`${star} ${t("store.rate.rating")}`}
						className="flex size-6 cursor-pointer items-center justify-center transition-transform hover:scale-110"
						key={star}
						onClick={() => setRating(star)}
						onMouseEnter={() => setHovered(star)}
						type="button"
					>
						<LuStar className={isSelected ? "size-6 fill-warning text-warning" : "size-6 text-foreground"} />
						</button>
					);
				})}
			</div>
			<TextField
				label={t("store.rate.products.comment")}
				onValueChange={setComment}
				placeholder={t("store.rate.commentPlaceholder")}
				value={comment}
			/>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			{errorKey && <p className="text-destructive text-sm">{(t as any)(errorKey)}</p>}
			<Button disabled={rating === 0 || isPending} onClick={submit} size="sm" type="button">
				{isPending ? t("store.rate.products.submitting") : t("store.rate.products.submit")}
			</Button>
		</div>
	);
}
