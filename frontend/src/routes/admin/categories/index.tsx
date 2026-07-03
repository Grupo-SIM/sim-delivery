import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetCategories } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";
import { CategoriesTable, CreateCategoryForm } from "./components";

function CategoriesPage() {
	const { t } = useTranslation();
	const { data: categories, isError, isPending } = useGetCategories();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.categories.subtitle")} title={t("admin.categories.title")} />

			<CreateCategoryForm />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.categories.loadError")} />
			) : (
				<CategoriesTable categories={categories} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/categories/")({
	beforeLoad: requireStaffBeforeLoad,
	component: CategoriesPage,
});
