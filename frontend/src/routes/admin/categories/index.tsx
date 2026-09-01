import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { canManageCatalog, canToggleProductAvailability } from "@/lib/staff-guard";
import { useGetCategories } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { CategoriesTable, CreateCategoryForm } from "./components";

function CategoriesPage() {
	const { t } = useTranslation();
	const role = useAuthStore(state => state.role);
	const canManage = canManageCatalog(role);
	const canToggleAvailability = canToggleProductAvailability(role);
	const { data: categories, isError, isPending } = useGetCategories();
	const [search, setSearch] = useState("");

	const filteredCategories = useMemo(() => {
		if (!categories) return categories;
		const query = search.trim().toLowerCase();
		if (!query) return categories;
		return categories.filter(
			category =>
				category.name.toLowerCase().includes(query) ||
				category.products.some(product => product.title.toLowerCase().includes(query)),
		);
	}, [categories, search]);

	return (
		<Container className="space-y-6 py-6 sm:py-8">
			<SectionHeading subtitle={t("admin.categories.subtitle")} title={t("admin.categories.title")} />

			{canManage && <CreateCategoryForm />}

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.categories.loadError")} />
			) : (
				<CategoriesTable
					canManage={canManage}
					canToggleAvailability={canToggleAvailability}
					categories={categories}
					onSearchChange={setSearch}
					search={search}
					visibleCategories={filteredCategories}
				/>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/categories/")({
	component: CategoriesPage,
});
