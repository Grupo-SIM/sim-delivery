import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetDiscounts, useGetProducts, useGetTags, useGetUnits } from "@/lib/api";
import { CreateDiscountForm, DiscountsTable } from "./components";

function DiscountsPage() {
	const { t } = useTranslation();
	const discountsQuery = useGetDiscounts();
	const productsQuery = useGetProducts();
	const tagsQuery = useGetTags();
	const unitsQuery = useGetUnits();
	const queries = [discountsQuery, productsQuery, tagsQuery, unitsQuery];

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.discounts.subtitle")} title={t("admin.discounts.title")} />
			{queries.some(query => query.isPending) ? (
				<>
					<Skeleton className="h-96 w-full" />
					<Skeleton className="h-40 w-full" />
				</>
			) : queries.some(query => query.isError) ? (
				<ErrorState title={t("admin.discounts.loadError")} />
			) : (
				<>
					<CreateDiscountForm products={productsQuery.data} tags={tagsQuery.data} units={unitsQuery.data} />
					<DiscountsTable
						discounts={discountsQuery.data ?? []}
						products={productsQuery.data}
						tags={tagsQuery.data}
						units={unitsQuery.data}
					/>
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/discounts/")({
	component: DiscountsPage,
});
