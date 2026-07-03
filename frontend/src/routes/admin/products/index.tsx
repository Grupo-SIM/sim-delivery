import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetProducts } from "@/lib/api";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";
import { CreateProductForm, ProductsTable } from "./components";

function ProductsPage() {
	const { t } = useTranslation();
	const { data: products, isError, isPending } = useGetProducts();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.products.subtitle")} title={t("admin.products.title")} />

			<CreateProductForm />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.products.loadError")} />
			) : (
				<ProductsTable products={products} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/products/")({
	beforeLoad: requireStaffBeforeLoad,
	component: ProductsPage,
});
