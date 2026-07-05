import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { usePostReviews } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextField } from "@/components/ui/TextField";

const searchSchema = z.object({
	orderId: z.string(),
});

function RatePage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const { orderId } = Route.useSearch();

	const [rating, setRating] = useState(0);
	const [hovered, setHovered] = useState(0);
	const [comment, setComment] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [errorKey, setErrorKey] = useState<string | null>(null);

	const { isPending, mutate } = usePostReviews();

	function submit() {
		if (rating === 0) return;
		setErrorKey(null);
		mutate(
			{ data: { comment: comment.trim() || undefined, orderId, rating } },
			{
				onError: (err: { status?: number }) => {
					if (err.status === 409) setErrorKey("store.rate.alreadyReviewed");
					else if (err.status === 422) setErrorKey("store.rate.notEligible");
					else setErrorKey("store.rate.error");
				},
				onSuccess: () => setSubmitted(true),
			},
		);
	}

	if (submitted) {
		return (
			<Container className="max-w-lg space-y-6 py-16 text-center">
				<p className="text-5xl">⭐</p>
				<SectionHeading title={t("store.rate.success")} />
				<Link className="text-primary text-sm underline" params={{ unitId }} to="/$unitId">
					{t("store.checkout.thankYou.continue")}
				</Link>
			</Container>
		);
	}

	return (
		<Container className="max-w-lg space-y-6 py-8">
			<SectionHeading subtitle={t("store.rate.subtitle")} title={t("store.rate.title")} />

			<div className="space-y-2">
				<p className="font-medium text-sm">{t("store.rate.rating")}</p>
				<div className="flex gap-1">
					{[1, 2, 3, 4, 5].map(star => (
						<button
							className="text-3xl transition-transform hover:scale-110"
							key={star}
							onClick={() => setRating(star)}
							onMouseEnter={() => setHovered(star)}
							onMouseLeave={() => setHovered(0)}
							type="button"
						>
							{(hovered || rating) >= star ? "⭐" : "☆"}
						</button>
					))}
				</div>
			</div>

			<TextField
				label={t("store.rate.comment")}
				onValueChange={setComment}
				placeholder={t("store.rate.commentPlaceholder")}
				value={comment}
			/>

			{errorKey && <p className="text-destructive text-sm">{t(errorKey as Parameters<typeof t>[0])}</p>}

			<Button disabled={rating === 0 || isPending} onClick={submit} type="button">
				{isPending ? t("store.rate.submitting") : t("store.rate.submit")}
			</Button>
		</Container>
	);
}

export const Route = createFileRoute("/$unitId/rate/")({
	component: RatePage,
	validateSearch: searchSchema,
});
