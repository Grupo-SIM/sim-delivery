import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { canManageCatalog, canToggleProductAvailability, requiresSelectedUnit } from "@/lib/staff-guard";
import { useGetProducts } from "@/lib/api";
import { useAdminSelectedUnitStore, useAuthStore } from "@/stores";
import { CreateProductForm, ProductsTable } from "./components";

function ProductsPage() {
	const { t } = useTranslation();
	const role = useAuthStore(state => state.role);
	const canManage = canManageCatalog(role);
	const canToggleAvailability = canToggleProductAvailability(role);
	const selectedUnitId = useAdminSelectedUnitStore(state => state.unitId);
	const needsUnitSelection = requiresSelectedUnit(role);
	const { data: products, isError, isPending } = useGetProducts();
	const [search, setSearch] = useState("");

	const filteredProducts = useMemo(() => {
		if (!products) return products;
		const query = search.trim().toLowerCase();
		if (!query) return products;
		return products.filter(product => product.title.toLowerCase().includes(query));
	}, [products, search]);

	return (
		<Container className="space-y-6 py-6 sm:py-8">
			<SectionHeading subtitle={t("admin.products.catalogSubtitle")} title={t("admin.products.title")} />

			{canManage && <CreateProductForm />}

			<div className="max-w-sm">
				<TextField
					label={t("admin.products.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.products.search.placeholder")}
					value={search}
				/>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.products.loadError")} />
			) : (
				<ProductsTable
					canManage={canManage}
					canToggleAvailability={canToggleAvailability}
					products={filteredProducts ?? []}
					selectedUnitId={needsUnitSelection ? selectedUnitId : null}
				/>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/products/")({
	component: ProductsPage,
});
