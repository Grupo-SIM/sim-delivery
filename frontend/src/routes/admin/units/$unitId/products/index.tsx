import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCategories, useGetProducts, useGetUnits, useGetUnitsByUnitIdProducts } from "@/lib/api";
import { AssociateProductForm, UnitProductsTable } from "./components";

function UnitProductsPage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const associationsQuery = useGetUnitsByUnitIdProducts(unitId);
	const { data: products } = useGetProducts();
	const { data: categories } = useGetCategories();
	const { data: units } = useGetUnits();

	const unit = units?.find(u => u.id === unitId);

	return (
		<Container className="space-y-6 py-8">
			<Link className="text-muted-foreground text-sm hover:text-foreground" to="/admin/units">
				← {t("admin.unitProducts.back")}
			</Link>

			<SectionHeading
				subtitle={t("admin.unitProducts.subtitle", { name: unit?.name ?? "" })}
				title={t("admin.unitProducts.title")}
			/>

			{associationsQuery.isPending ? (
				<Skeleton className="h-40 w-full" />
			) : associationsQuery.isError ? (
				<ErrorState title={t("admin.unitProducts.loadError")} />
			) : (
				<>
					<AssociateProductForm
						associations={associationsQuery.data}
						categories={categories ?? []}
						products={products ?? []}
						unitId={unitId}
					/>

					<UnitProductsTable
						associations={associationsQuery.data}
						categories={categories ?? []}
						products={products ?? []}
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
