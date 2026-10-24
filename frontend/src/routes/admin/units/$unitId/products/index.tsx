import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	useGetCategories,
	useGetProducts,
	useGetTags,
	useGetUnits,
	useGetUnitsByUnitIdProducts,
} from "@/lib/api";
import { AssociateProductForm, AvailabilityBulkActions, UnitMenuActions, UnitProductsTable } from "./components";

function UnitProductsPage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const associationsQuery = useGetUnitsByUnitIdProducts(unitId);
	const productsQuery = useGetProducts();
	const categoriesQuery = useGetCategories();
	const tagsQuery = useGetTags();
	const unitsQuery = useGetUnits();
	const products = productsQuery.data;
	const categories = categoriesQuery.data;
	const tags = tagsQuery.data;
	const units = unitsQuery.data;

	const unit = units?.find(u => u.id === unitId);

	return (
		<Container className="space-y-6 py-8">
			<Link className="text-muted-foreground text-sm hover:text-foreground" to="/admin/units">
				← {t("admin.unitProducts.back")}
			</Link>

			<SectionHeading
				action={unit && <UnitMenuActions unitName={unit.name} unitSlug={unit.slug} />}
				subtitle={t("admin.unitProducts.subtitle", { name: unit?.name ?? "" })}
				title={t("admin.unitProducts.title")}
			/>

			{associationsQuery.isPending ||
			productsQuery.isPending ||
			categoriesQuery.isPending ||
			tagsQuery.isPending ||
			unitsQuery.isPending ? (
				<Skeleton className="h-40 w-full" />
			) : associationsQuery.isError ? (
				<ErrorState title={t("admin.unitProducts.loadError")} />
			) : (
				<>
					<AssociateProductForm
						associations={associationsQuery.data}
						categories={categories ?? []}
						products={products ?? []}
						tags={tags ?? []}
						unitId={unitId}
					/>

					<AvailabilityBulkActions
						categories={categories ?? []}
						disabled={associationsQuery.data.length === 0}
						unitId={unitId}
					/>

					<UnitProductsTable
						associations={associationsQuery.data}
						categories={categories ?? []}
						products={products ?? []}
						tags={tags ?? []}
						unitId={unitId}
					/>
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/units/$unitId/products/")({
	component: UnitProductsPage,
});
