import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetProductReviews, useGetReviews } from "@/lib/api";

function stars(rating: number): string {
	return "⭐".repeat(rating) + "☆".repeat(5 - rating);
}

function UnitReviewsTab() {
	const { t } = useTranslation();
	const { data: reviews, isError, isPending } = useGetReviews();

	const avg =
		reviews && reviews.length > 0
			? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
			: null;

	return (
		<div className="space-y-4">
			{avg && (
				<p className="text-muted-foreground text-sm">
					{t("admin.reviews.average")}: <span className="font-semibold text-foreground">{avg} / 5</span>
				</p>
			)}

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.reviews.loadError")} />
			) : reviews.length === 0 ? (
				<EmptyState title={t("admin.reviews.empty")} />
			) : (
				<DataTable>
					<thead>
						<tr className="border-border border-b text-left text-muted-foreground">
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.date")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.customer")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.rating")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.comment")}</th>
						</tr>
					</thead>
					<tbody>
						{reviews.map(r => (
							<tr className="border-border/60 border-b last:border-0" key={r.id}>
								<td className="px-4 py-3 text-muted-foreground text-sm">
									{new Date(r.createdAt).toLocaleDateString("pt-BR")}
								</td>
								<td className="px-4 py-3 font-medium">{r.customerName}</td>
								<td className="px-4 py-3 text-sm">{stars(Number(r.rating))}</td>
								<td className="px-4 py-3 text-muted-foreground text-sm">{r.comment ?? "—"}</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			)}
		</div>
	);
}

function ProductReviewsTab() {
	const { t } = useTranslation();
	const { data: reviews, isError, isPending } = useGetProductReviews({});

	const avg =
		reviews && reviews.length > 0
			? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
			: null;

	return (
		<div className="space-y-4">
			{avg && (
				<p className="text-muted-foreground text-sm">
					{t("admin.reviews.average")}: <span className="font-semibold text-foreground">{avg} / 5</span>
				</p>
			)}

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.reviews.productLoadError")} />
			) : reviews.length === 0 ? (
				<EmptyState title={t("admin.reviews.productEmpty")} />
			) : (
				<DataTable>
					<thead>
						<tr className="border-border border-b text-left text-muted-foreground">
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.date")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.productColumns.product")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.customer")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.rating")}</th>
							<th className="px-4 py-3 font-medium">{t("admin.reviews.columns.comment")}</th>
						</tr>
					</thead>
					<tbody>
						{reviews.map(r => (
							<tr className="border-border/60 border-b last:border-0" key={r.id}>
								<td className="px-4 py-3 text-muted-foreground text-sm">
									{new Date(r.createdAt).toLocaleDateString("pt-BR")}
								</td>
								<td className="px-4 py-3 font-medium">{r.productTitle}</td>
								<td className="px-4 py-3 font-medium">{r.customerName}</td>
								<td className="px-4 py-3 text-sm">{stars(Number(r.rating))}</td>
								<td className="px-4 py-3 text-muted-foreground text-sm">{r.comment ?? "—"}</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			)}
		</div>
	);
}

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
