import { createFileRoute, Link } from "@tanstack/react-router";
import { LuStar } from "react-icons/lu";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextField } from "@/components/ui/TextField";
import { usePostReviews } from "@/lib/api";
import { useGetCustomerOrder } from "@/lib/api/get-customer-order";
import { slug } from "@/lib/variant";
import { ProductRatingRow } from "./components";

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
	const orderQuery = useGetCustomerOrder(orderId, slug ?? "");

	const uniqueProducts = orderQuery.data
		? [...new Map(orderQuery.data.items.map(item => [item.productId, item.productName])).entries()]
		: [];

	function submit() {
		if (rating === 0) return;
		setErrorKey(null);
		mutate(
			{ data: { comment: comment.trim() || undefined, orderId, rating, slug: slug ?? "" } },
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

	return (
		<Container className="max-w-lg space-y-8 py-8">
			{submitted ? (
				<div className="space-y-6 text-center">
					<p className="text-5xl">⭐</p>
					<SectionHeading title={t("store.rate.success")} />
				</div>
			) : (
				<div className="space-y-6">
					<SectionHeading subtitle={t("store.rate.subtitle")} title={t("store.rate.title")} />

					<div className="space-y-2">
						<p className="font-medium text-sm">{t("store.rate.rating")}</p>
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
					</div>

					<TextField
						label={t("store.rate.comment")}
						onValueChange={setComment}
						placeholder={t("store.rate.commentPlaceholder")}
						value={comment}
					/>

					{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
					{errorKey && <p className="text-destructive text-sm">{(t as any)(errorKey)}</p>}

					<Button disabled={rating === 0 || isPending} onClick={submit} type="button">
						{isPending ? t("store.rate.submitting") : t("store.rate.submit")}
					</Button>
				</div>
			)}

			{uniqueProducts.length > 0 && (
				<div className="space-y-3">
					<SectionHeading
						subtitle={t("store.rate.products.subtitle")}
						title={t("store.rate.products.title")}
					/>
					{uniqueProducts.map(([productId, productName]) => (
						<ProductRatingRow
							key={productId}
							orderId={orderId}
							productId={productId}
							productName={productName}
						/>
					))}
				</div>
			)}

			{submitted && (
				<Link className="block text-center text-primary text-sm underline" params={{ unitId }} to="/$unitId">
					{t("store.checkout.thankYou.continue")}
				</Link>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/rate/")({
	component: RatePage,
	validateSearch: searchSchema,
});
